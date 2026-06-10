import { redirect } from "next/navigation";

export default function AdminMtnMomoRedirectPage() {
  redirect("/general-office/payment-gateways");
}
