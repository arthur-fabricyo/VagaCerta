import Image from "next/image";
import { FormularioAcesso } from "../_components/formulario-acesso";

export default function SignInPage() {
  return (
    <div className="md:grid md:grid-cols-2">
      <div className="relative hidden bg-slate-800 md:block">
        <Image
          src="/images/login-parking.webp"
          alt=""
          fill
          sizes="(min-width: 768px) 50vw, 1px"
          className="object-cover"
        />
      </div>
      <div className="min-w-0">
        <FormularioAcesso />
      </div>
    </div>
  );
}
