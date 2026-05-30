declare module "*.css" {
  const classes: Record<string, string>; // ← Record
  export default classes;
}
