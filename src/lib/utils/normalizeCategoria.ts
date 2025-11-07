export function normalizeCategoriaNome(nome: string): string {
  if (!nome) return "";

  return nome
    .trim()
    .replace(/\s+/g, " ") // Remove espaços múltiplos
    .split(" ")
    .map((word) => {
      if (!word) return "";
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}
