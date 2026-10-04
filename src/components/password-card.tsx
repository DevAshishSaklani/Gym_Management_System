import { changePasswordAction } from "@/app/actions/auth";
import { SubmitButton } from "@/components/buttons";
import { Card, Field, btn, inputCls } from "@/components/ui";

export default function PasswordCard() {
  return (
    <Card title="Change password">
      <form action={changePasswordAction} className="grid gap-4 sm:grid-cols-2">
        <Field label="Current password"><input name="current" type="password" required className={inputCls} /></Field>
        <Field label="New password"><input name="next" type="password" required minLength={6} className={inputCls} /></Field>
        <div className="sm:col-span-2"><SubmitButton className={btn("dark")}>Update password</SubmitButton></div>
      </form>
    </Card>
  );
}
