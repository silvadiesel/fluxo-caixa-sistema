import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import "dayjs/locale/pt-br";

// Configura plugins
dayjs.extend(utc);
dayjs.extend(timezone);

// Define timezone padrão como America/Sao_Paulo
dayjs.tz.setDefault("America/Sao_Paulo");

// Define locale padrão como pt-BR
dayjs.locale("pt-br");

export default dayjs;
