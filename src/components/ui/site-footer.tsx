export function SiteFooter({ light }: { light?: boolean }) {
  return (
    <footer className={`site-footer${light ? " site-footer-light" : ""}`}>
      Powered by <strong>MNFSR</strong>
    </footer>
  );
}
