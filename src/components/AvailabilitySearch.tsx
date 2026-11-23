import { Search } from "lucide-react";

export function AvailabilitySearch() {
  return (
    <form className="search-panel" action="/acomodacoes">
      <label>Check-in<input name="checkin" type="date" lang="pt-BR" required /></label>
      <label>Check-out<input name="checkout" type="date" lang="pt-BR" required /></label>
      <label>Hóspedes<select name="guests" defaultValue="2">{Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? "hóspede" : "hóspedes"}</option>)}</select></label>
      <button className="button" type="submit"><Search size={16} /> Ver disponibilidade</button>
    </form>
  );
}
