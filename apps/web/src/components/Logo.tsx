/** The Simpuru mark, the same shape as the landing page logo and the tab icon. */
export default function Logo({
  className,
  fill = "currentColor",
}: {
  className?: string;
  fill?: string;
}) {
  return (
    <svg viewBox="0 0 512 512" fill={fill} aria-hidden className={className}>
      <path d="M190 56h166a24 24 0 0 1 24 24v160H190a92 92 0 0 1 0-184z" />
      <path d="M132 272h190a92 92 0 0 1 0 184H156a24 24 0 0 1-24-24z" />
    </svg>
  );
}
