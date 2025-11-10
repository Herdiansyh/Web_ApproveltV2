import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/Components/ui/card';

export default function Index({ auth, templates }) {
  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold">Templates</h2>}>
      <Head title="Templates" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Templates</h1>
          <Link href={route('templates.create')}>
            <Button>New Template</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Template</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Slug</th>
                    <th className="py-2 pr-4">Version</th>
                    <th className="py-2 pr-4">Fields</th>
                    <th className="py-2 pr-4">Active</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.data?.map((t) => (
                    <tr key={t.id} className="border-b hover:bg-muted/40">
                      <td className="py-2 pr-4 font-medium">{t.name}</td>
                      <td className="py-2 pr-4">{t.slug}</td>
                      <td className="py-2 pr-4">{t.version}</td>
                      <td className="py-2 pr-4">{t.fields_count}</td>
                      <td className="py-2 pr-4">{t.is_active ? 'Yes' : 'No'}</td>
                      <td className="py-2 pr-4 space-x-2">
                        <Link href={route('templates.show', t.id)} className="text-blue-600">View</Link>
                        <Link href={route('templates.edit', t.id)} className="text-amber-600">Edit</Link>
                        <button
                          className="text-red-600"
                          onClick={() => {
                            if (confirm('Delete this template?')) {
                              router.delete(route('templates.destroy', t.id));
                            }
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination simple */}
            <div className="mt-4 flex gap-2">
              {templates.links?.map((l, idx) => (
                <Link
                  key={idx}
                  href={l.url || '#'}
                  className={`px-3 py-1 border rounded ${l.active ? 'bg-primary text-primary-foreground' : ''} ${!l.url ? 'opacity-50 cursor-default' : ''}`}
                  dangerouslySetInnerHTML={{ __html: l.label }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
