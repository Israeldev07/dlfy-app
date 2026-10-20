"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";

/** Lo que edita el admin. `id` solo existe en lo ya guardado; `key` es para React. */
export type EditableOption = { key: string; id?: string; name: string; price: string };
export type EditableGroup = { key: string; id?: string; name: string; required: boolean; maxSelect: number; options: EditableOption[] };

let seq = 0;
const newKey = () => `n${++seq}`;
const newOption = (): EditableOption => ({ key: newKey(), name: "", price: "" });
const newGroup = (): EditableGroup => ({ key: newKey(), name: "", required: true, maxSelect: 1, options: [newOption(), newOption()] });

const inputBase =
  "rounded-control bg-surface text-[15px] text-ink ring-1 ring-ink/20 transition-shadow duration-150 outline-none placeholder:text-ink-soft hover:ring-ink/35 focus-visible:ring-2 focus-visible:ring-route-deep";
const input = `${inputBase} h-11 w-full px-3.5`;
const iconButton =
  "inline-flex size-10 flex-none items-center justify-center rounded-control text-ink/60 transition-colors duration-150 hover:bg-ink/[0.06] hover:text-ink disabled:pointer-events-none disabled:opacity-30";

/**
 * Grupos de acompañantes y extras del producto. Se envían como JSON en `optionGroups`;
 * el servidor los valida (Zod) y decide los precios.
 */
export function OptionGroupsEditor({ initial, error }: { initial: EditableGroup[]; error?: string }) {
  const [groups, setGroups] = useState<EditableGroup[]>(initial);

  const payload = JSON.stringify(
    groups.map((g) => ({
      id: g.id,
      name: g.name,
      required: g.required,
      maxSelect: g.maxSelect,
      options: g.options.map((o) => ({ id: o.id, name: o.name, price: o.price })),
    })),
  );

  const updateGroup = (key: string, patch: Partial<EditableGroup>) =>
    setGroups((gs) => gs.map((g) => (g.key === key ? { ...g, ...patch } : g)));
  const updateOption = (groupKey: string, optionKey: string, patch: Partial<EditableOption>) =>
    setGroups((gs) =>
      gs.map((g) => (g.key === groupKey ? { ...g, options: g.options.map((o) => (o.key === optionKey ? { ...o, ...patch } : o)) } : g)),
    );
  const move = (index: number, delta: number) =>
    setGroups((gs) => {
      const next = [...gs];
      const [item] = next.splice(index, 1);
      next.splice(index + delta, 0, item!);
      return next;
    });

  return (
    <section aria-labelledby="acompanantes" className="flex flex-col gap-3">
      <input type="hidden" name="optionGroups" value={payload} />
      <div>
        <h2 id="acompanantes" className="text-[16px] font-bold">
          Acompañantes y extras
        </h2>
        <p className="text-[13.5px] text-ink-soft">
          Para no repetir el mismo plato: crea uno solo (p. ej. «Tilapia frita») y deja que el cliente elija con qué lo acompaña.
        </p>
      </div>
      {error ? (
        <p role="alert" className="text-[13.5px] font-medium text-brand-deep">
          {error}
        </p>
      ) : null}

      {groups.length > 0 ? (
        <ol className="flex flex-col divide-y divide-line border-y border-line">
          {groups.map((g, gi) => (
            <li key={g.key} className="flex flex-col gap-3 py-4">
              <div className="flex items-end gap-2">
                <label className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-[13px] font-semibold text-ink-soft">Grupo {gi + 1}</span>
                  <input
                    value={g.name}
                    onChange={(e) => updateGroup(g.key, { name: e.target.value })}
                    placeholder="Ej. Acompañante, Agrega, Salsas"
                    maxLength={60}
                    aria-label={`Nombre del grupo ${gi + 1}`}
                    className={input}
                  />
                </label>
                <button type="button" onClick={() => move(gi, -1)} disabled={gi === 0} aria-label={`Subir el grupo ${gi + 1}`} className={iconButton}>
                  <ArrowUp aria-hidden className="size-4" strokeWidth={2} />
                </button>
                <button
                  type="button"
                  onClick={() => move(gi, 1)}
                  disabled={gi === groups.length - 1}
                  aria-label={`Bajar el grupo ${gi + 1}`}
                  className={iconButton}
                >
                  <ArrowDown aria-hidden className="size-4" strokeWidth={2} />
                </button>
                <button
                  type="button"
                  onClick={() => setGroups((gs) => gs.filter((x) => x.key !== g.key))}
                  aria-label={`Quitar el grupo ${gi + 1}`}
                  className={`${iconButton} hover:text-brand-deep`}
                >
                  <X aria-hidden className="size-[18px]" strokeWidth={2} />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px]">
                <label className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={g.required}
                    onChange={(e) => updateGroup(g.key, { required: e.target.checked })}
                    className="size-5 accent-route-deep"
                  />
                  <span className="font-medium">Obligatorio</span>
                </label>
                <label className="flex items-center gap-2.5">
                  <span className="font-medium whitespace-nowrap">Puede elegir hasta</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={Math.max(1, g.options.length)}
                    value={g.maxSelect}
                    onChange={(e) => updateGroup(g.key, { maxSelect: Math.max(1, Math.floor(Number(e.target.value) || 1)) })}
                    className={`${inputBase} tabular h-10 w-16 px-2 text-center`}
                  />
                </label>
              </div>

              <ul className="flex flex-col gap-2">
                {g.options.map((o, oi) => (
                  <li key={o.key} className="flex items-center gap-2">
                    <input
                      value={o.name}
                      onChange={(e) => updateOption(g.key, o.key, { name: e.target.value })}
                      placeholder={oi === 0 ? "Ej. Patacón" : oi === 1 ? "Ej. Yuca" : "Opción"}
                      maxLength={60}
                      aria-label={`Grupo ${gi + 1}, nombre de la opción ${oi + 1}`}
                      className={`${input} min-w-0 flex-1`}
                    />
                    <div className="relative w-28 flex-none">
                      <span aria-hidden className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[14px] text-ink-soft">
                        +$
                      </span>
                      <input
                        value={o.price}
                        onChange={(e) => updateOption(g.key, o.key, { price: e.target.value })}
                        inputMode="decimal"
                        placeholder="0.00"
                        aria-label={`Grupo ${gi + 1}, precio extra de la opción ${oi + 1}`}
                        className={`${input} tabular pl-8`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => updateGroup(g.key, { options: g.options.filter((x) => x.key !== o.key) })}
                      disabled={g.options.length === 1}
                      aria-label={`Quitar la opción ${oi + 1} del grupo ${gi + 1}`}
                      className={`${iconButton} hover:text-brand-deep`}
                    >
                      <X aria-hidden className="size-4" strokeWidth={2} />
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => updateGroup(g.key, { options: [...g.options, newOption()] })}
                className="inline-flex min-h-10 w-fit items-center gap-1.5 px-1 text-[14px] font-semibold text-store hover:text-ink"
              >
                <Plus aria-hidden className="size-4" strokeWidth={2.25} />
                Agregar opción
              </button>
            </li>
          ))}
        </ol>
      ) : null}

      <button
        type="button"
        onClick={() => setGroups((gs) => [...gs, newGroup()])}
        className="inline-flex min-h-11 w-fit items-center gap-2 rounded-control px-4 text-[14px] font-semibold text-ink ring-1 ring-ink/15 transition-colors duration-150 hover:bg-ink/[0.05]"
      >
        <Plus aria-hidden className="size-4" strokeWidth={2.25} />
        {groups.length === 0 ? "Agregar acompañantes" : "Agregar otro grupo"}
      </button>
      <p className="text-[13px] text-ink-soft">El precio extra es opcional: déjalo vacío si no cambia el precio.</p>
    </section>
  );
}
