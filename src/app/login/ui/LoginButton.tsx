export default function LoginButton({
  label = "Đăng nhập bằng Google",
  className = "btn"
}: {
  label?: string;
  className?: string;
}) {
  return (
    <a className={className} href="/auth/login">
      {label}
    </a>
  );
}
