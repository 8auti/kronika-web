export default function SinAcceso() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <img src={"/img/grifo-prohibido.png"} alt="" className="mx-auto block w-50 mb-6" />

        <h1 className="text-3xl font-bold">Sin acceso</h1>

        <p className="mt-2 text-gray-600">
          No tenés permisos para acceder a esta sección.
        </p>
      </div>
    </main>
  );
}