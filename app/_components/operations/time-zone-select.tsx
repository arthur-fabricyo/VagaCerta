"use client";

import { useEffect, useState } from "react";

const brazilTimeZones = [
  ["America/Sao_Paulo", "Brasília / São Paulo"],
  ["America/Noronha", "Fernando de Noronha"],
  ["America/Belem", "Belém"],
  ["America/Fortaleza", "Fortaleza"],
  ["America/Recife", "Recife"],
  ["America/Araguaina", "Araguaína"],
  ["America/Maceio", "Maceió"],
  ["America/Bahia", "Salvador"],
  ["America/Campo_Grande", "Campo Grande"],
  ["America/Cuiaba", "Cuiabá"],
  ["America/Santarem", "Santarém"],
  ["America/Porto_Velho", "Porto Velho"],
  ["America/Boa_Vista", "Boa Vista"],
  ["America/Manaus", "Manaus"],
  ["America/Eirunepe", "Eirunepé"],
  ["America/Rio_Branco", "Rio Branco"],
] as const;

const brazilZoneIds = new Set<string>(brazilTimeZones.map(([id]) => id));

export function TimeZoneSelect() {
  const [otherTimeZones, setOtherTimeZones] = useState<string[]>([]);

  useEffect(() => {
    if (typeof Intl.supportedValuesOf !== "function") return;
    setOtherTimeZones(Intl.supportedValuesOf("timeZone").filter((id) => !brazilZoneIds.has(id)));
  }, []);

  return (
    <select name="timeZone" defaultValue="America/Sao_Paulo" required>
      <optgroup label="Brasil">
        {brazilTimeZones.map(([id, label]) => <option key={id} value={id}>{label} ({id})</option>)}
      </optgroup>
      <optgroup label="Outros fusos">
        <option value="UTC">UTC</option>
        {otherTimeZones.map((id) => <option key={id} value={id}>{id.replaceAll("_", " ")}</option>)}
      </optgroup>
    </select>
  );
}
