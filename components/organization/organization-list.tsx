import Link from "next/link";

type OrganizationListProps = {
  organizations: any[];
};

export function OrganizationList({ organizations }: OrganizationListProps) {
  return (
    <div className="rounded-md overflow-hidden border">
      <div className="grid grid-cols-12 border-b py-3 px-4 font-medium bg-muted/50">
        <div className="col-span-4">Nome</div>
        <div className="col-span-3">Identificador</div>
        <div className="col-span-3">Email</div>
        <div className="col-span-2">Ações</div>
      </div>
      {organizations && organizations.length > 0 ? (
        <div className="divide-y">
          {organizations.map((org) => (
            <div
              key={org.id}
              className="grid grid-cols-12 py-3 px-4 hover:bg-muted/20 transition-colors"
            >
              <div className="col-span-4 flex items-center font-medium">
                {org.nome || "Sem nome"}
              </div>
              <div className="col-span-3 flex items-center text-muted-foreground">
                {org.slug || "-"}
              </div>
              <div className="col-span-3 flex items-center text-muted-foreground">
                {org.email || "-"}
              </div>
              <div className="col-span-2 flex items-center space-x-2">
                <Link
                  href={`/dashboard/organization/${org.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  Gerenciar
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center text-muted-foreground">
          Nenhuma organização encontrada
        </div>
      )}
    </div>
  );
}