import { requireCapabilityPage } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { Badge } from "@/components/ui/primitives";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { DialogButton } from "@/components/ui/dialog";
import { ArticleForm } from "@/features/catalog/forms";
import { ToggleActiveButton } from "@/features/catalog/row-actions";
import { toggleArticleAction } from "@/features/catalog/actions";

export const metadata = { title: "Artículos · Acopia" };

export default async function ArticulosPage() {
  await requireCapabilityPage("article.manage");
  const articles = await prisma.article.findMany({
    orderBy: [{ active: "desc" }, { category: "asc" }, { name: "asc" }],
  });

  return (
    <>
      <PageHeader
        title="Catálogo de artículos"
        description="Artículos que se pueden recibir. Categorías y unidades flexibles."
        breadcrumbs={[{ label: "Inicio", href: "/inicio" }, { label: "Artículos" }]}
        actions={
          <DialogButton
            label="Nuevo artículo"
            title="Nuevo artículo"
            width="lg"
          >
            <ArticleForm />
          </DialogButton>
        }
      />
      <div className="space-y-6">
        {articles.length === 0 ? (
          <EmptyState title="No hay artículos en el catálogo." />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Artículo</TH>
                <TH>Categoría</TH>
                <TH>Unidad</TH>
                <TH>Estado</TH>
                <TH className="text-right">Acciones</TH>
              </TR>
            </THead>
            <TBody>
              {articles.map((a) => (
                <TR key={a.id}>
                  <TD className="font-medium text-slate-900">{a.name}</TD>
                  <TD>{a.category}</TD>
                  <TD>{a.unit}</TD>
                  <TD>
                    <Badge color={a.active ? "green" : "slate"}>
                      {a.active ? "Activo" : "Inactivo"}
                    </Badge>
                  </TD>
                  <TD className="text-right">
                    <ToggleActiveButton
                      id={a.id}
                      active={a.active}
                      action={toggleArticleAction}
                      entityLabel="el artículo"
                    />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </div>
    </>
  );
}
