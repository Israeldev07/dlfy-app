import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import type { OptionGroupsInput } from "@/lib/validations/admin";

/**
 * Deja los grupos de opciones del producto tal como vienen del formulario. Conserva los ids de lo
 * que sigue existiendo (los carritos abiertos guardan esos ids), borra lo que se quitó y crea lo
 * nuevo. Un id que no es de este producto se trata como nuevo: no se puede editar lo ajeno.
 * Los pedidos no se ven afectados: guardan el resumen de opciones como texto.
 */
export async function syncOptionGroups(tx: Prisma.TransactionClient, productId: string, groups: OptionGroupsInput) {
  const existing = await tx.productOptionGroup.findMany({
    where: { productId },
    select: { id: true, options: { select: { id: true } } },
  });
  const existingGroups = new Map(existing.map((g) => [g.id, new Set(g.options.map((o) => o.id))]));
  const keptGroupIds = groups.map((g) => g.id).filter((id): id is string => !!id && existingGroups.has(id));

  await tx.productOptionGroup.deleteMany({ where: { productId, id: { notIn: keptGroupIds } } });

  for (const [position, group] of groups.entries()) {
    const data = { name: group.name, minSelect: group.minSelect, maxSelect: group.maxSelect, position };
    const ownOptions = group.id ? existingGroups.get(group.id) : undefined;

    if (!group.id || !ownOptions) {
      await tx.productOptionGroup.create({
        data: {
          ...data,
          productId,
          options: { create: group.options.map((o, i) => ({ name: o.name, priceDeltaCents: o.priceDeltaCents, position: i })) },
        },
        select: { id: true },
      });
      continue;
    }

    await tx.productOptionGroup.update({ where: { id: group.id }, data, select: { id: true } });
    const keptOptionIds = group.options.map((o) => o.id).filter((id): id is string => !!id && ownOptions.has(id));
    await tx.productOption.deleteMany({ where: { groupId: group.id, id: { notIn: keptOptionIds } } });
    for (const [i, option] of group.options.entries()) {
      const optionData = { name: option.name, priceDeltaCents: option.priceDeltaCents, position: i };
      if (option.id && ownOptions.has(option.id)) {
        await tx.productOption.update({ where: { id: option.id }, data: optionData, select: { id: true } });
      } else {
        await tx.productOption.create({ data: { ...optionData, groupId: group.id }, select: { id: true } });
      }
    }
  }
}
