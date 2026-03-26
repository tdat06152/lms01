export default function LoginButton({
  label = "Đăng nhập bằng Google"
}: {
  label?: string;
}) {
  return (
    <a className="btn" href="/auth/login">
      {label}
    </a>
  );
}
