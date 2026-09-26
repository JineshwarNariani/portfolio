import { login } from "@/app/admin/analytics/actions";

export function LoginForm({ failed, next = "/admin/analytics", title = "Analytics" }: { failed: boolean; next?: string; title?: string }) {
  return (
    <form action={login} className="admin-login">
      <input type="hidden" name="next" value={next} />
      <h1>{title}</h1>
      <p className="admin-muted">Private. Enter the admin password.</p>
      <label>
        <span>Password</span>
        <input type="password" name="password" autoComplete="current-password" required autoFocus />
      </label>
      {failed && <p className="admin-error">That password didn’t work.</p>}
      <button type="submit">Open dashboard</button>
    </form>
  );
}
