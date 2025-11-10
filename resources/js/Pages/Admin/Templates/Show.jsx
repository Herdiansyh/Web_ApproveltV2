import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';

export default function Show({ template }) {
  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold">Template Detail</h2>}>
      <Head title={`Template ${template.name}`} />
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{template.name}</h1>
          <Link href={route('templates.edit', template.id)}>
            <Button>Edit</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Meta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><strong>Slug:</strong> {template.slug}</div>
            <div><strong>Version:</strong> {template.version}</div>
            <div><strong>Active:</strong> {template.is_active ? 'Yes' : 'No'}</div>
            <div><strong>View Path:</strong> {template.html_view_path || '-'}</div>
            <div><strong>Description:</strong> {template.description || '-'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fields</CardTitle>
          </CardHeader>
          <CardContent>
            {template.fields?.length ? (
              <ul className="list-disc pl-6 text-sm">
                {template.fields.map((f) => (
                  <li key={f.id || f.name}>
                    <strong>{f.label}</strong> ({f.name}) — <em>{f.type}</em> {f.required ? '• required' : ''}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No fields</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Config JSON</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-3 rounded overflow-auto">{JSON.stringify(template.config_json, null, 2)}</pre>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
