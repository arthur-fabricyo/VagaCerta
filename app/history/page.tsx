import Link from "next/link";
import { exigirOperador } from "../../lib/acesso";
import { getPlateHistory, listHistoryUnits } from "../../lib/history/history-service";

type HistoryParams = Partial<Record<"unitId" | "plate" | "start" | "end", string | string[]>>;
const weekdays = ["segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado", "domingo"];
const formatHour = (hour: number) => `${String(hour).padStart(2, "0")}h`;
const formatDate = (date: string) => date.split("-").reverse().join("/");

export default async function HistoryPage({ searchParams }: { searchParams: Promise<HistoryParams> }) {
  await exigirOperador();
  const params = await searchParams;
  const units = await listHistoryUnits();
  const unit = units.find((item) => item.id === params.unitId) ?? units[0];
  const result = params.plate === undefined ? null : await getPlateHistory({
    unitId: params.unitId,
    plate: params.plate,
    start: params.start || undefined,
    end: params.end || undefined,
  }).catch(() => ({ status: "unavailable" } as const));
  const history = result?.status === "ok" ? result.history : null;
  const error = result?.status === "invalid" ? "Confira a unidade, a placa completa e as datas."
    : result?.status === "missing" ? "Unidade não encontrada."
      : result?.status === "unavailable" ? "Não foi possível consultar o histórico. Tente novamente." : null;

  return (
    <main className="mx-auto grid w-full max-w-4xl gap-6 px-5 py-8 sm:px-10">
      <header>
        <Link className="link" href="/">Voltar à operação</Link>
        <h1 className="mt-4 text-3xl font-semibold">Histórico por placa</h1>
      </header>
      {unit ? (
        <form className="painel grid gap-4 sm:grid-cols-2" action="/history">
          <label className="campo">Unidade
            <select name="unitId" defaultValue={unit.id} required>
              {units.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
            </select>
          </label>
          <label className="campo">Placa completa
            <input name="plate" defaultValue={typeof params.plate === "string" ? params.plate : ""} maxLength={24} required />
          </label>
          <label className="campo">Data inicial
            <input type="date" name="start" defaultValue={typeof params.start === "string" ? params.start : ""} />
          </label>
          <label className="campo">Data final
            <input type="date" name="end" defaultValue={typeof params.end === "string" ? params.end : ""} />
          </label>
          <button className="botao botao-primario justify-self-start" type="submit">Consultar</button>
        </form>
      ) : <p className="painel">Cadastre uma unidade para consultar o histórico.</p>}
      {error && <p role="alert" className="painel text-red-200">{error}</p>}
      {history && unit && (
        <section className="painel grid gap-3" aria-labelledby="results-heading">
          <h2 id="results-heading" className="text-xl font-semibold">{history.plate} · {unit.nome}</h2>
          <p>{history.start || history.end
            ? `${history.start ? `Desde ${formatDate(history.start)}` : "Desde o início"}${history.end ? ` até ${formatDate(history.end)}` : ""}`
            : "Todo o histórico da unidade"}</p>
          <p>{history.total === 0 ? "Nenhuma visita encerrada no período."
            : history.total === 1 ? "1 visita encerrada" : `${history.total} visitas encerradas`}</p>
          {history.lastEntryAt && <p>Última entrada em {new Intl.DateTimeFormat("pt-BR", {
            timeZone: unit.fuso, dateStyle: "short", timeStyle: "short",
          }).format(history.lastEntryAt)}</p>}
          {history.peaks.length > 0 && (
            <>
              <h3 className="font-semibold">{history.total === 1 ? "Horário observado" : "Horários de chegada mais frequentes"}</h3>
              <ul className="list-disc space-y-1 pl-5">
                {history.peaks.map(({ weekday, hour, count }) => (
                  <li key={`${weekday}-${hour}`}>
                    {weekdays[weekday - 1]}, das {formatHour(hour)} até antes das {formatHour(hour + 1)} · {count} de {history.total}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}
    </main>
  );
}
