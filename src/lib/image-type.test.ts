import { describe, expect, it } from "vitest";
import { sniffImageType } from "./image-type";

const bytes = (...values: (number | string)[]) =>
  new Uint8Array(values.flatMap((v) => (typeof v === "string" ? [...v].map((c) => c.charCodeAt(0)) : [v])));

describe("sniffImageType", () => {
  it("reconoce JPG, PNG y WebP por su firma", () => {
    expect(sniffImageType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("jpg");
    expect(sniffImageType(bytes(0x89, "PNG", 0x0d, 0x0a))).toBe("png");
    expect(sniffImageType(bytes("RIFF", 0, 0, 0, 0, "WEBP"))).toBe("webp");
  });

  it("rechaza lo que no es imagen aunque se llame .jpg", () => {
    expect(sniffImageType(bytes("<svg xmlns"))).toBeNull();
    expect(sniffImageType(bytes("%PDF-1.7"))).toBeNull();
    expect(sniffImageType(new Uint8Array())).toBeNull();
  });
});
