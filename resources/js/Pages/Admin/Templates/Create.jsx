import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/Components/ui/card';

export default function Create() {
  const { data, setData, post, processing, errors } = useForm({
    name: '',
    slug: '',
    description: '',
    html_view_path: '',
    is_active: true,
    version: 1,
    config_json: '',
    fields: [],
  });

  const addField = () => setData('fields', [...(data.fields || []), { name: '', label: '', type: 'text', required: false, order: (data.fields?.length || 0) }]);
  const removeField = (idx) => setData('fields', data.fields.filter((_, i) => i !== idx));

  const submit = (e) => {
    e.preventDefault();
    const payload = {
      ...data,
      config_json: data.config_json ? JSON.parse(data.config_json) : null,
    };
    post(route('templates.store'), { data: payload });
  };

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold">Create Template</h2>}>
      <Head title="Create Template" />
      <form onSubmit={submit} className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Template</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Name</label>
              <input className="mt-1 w-full border rounded px-3 py-2" value={data.name} onChange={(e) => setData('name', e.target.value)} />
              {errors.name && <p className="text-red-600 text-sm">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium">Slug</label>
              <input className="mt-1 w-full border rounded px-3 py-2" value={data.slug} onChange={(e) => setData('slug', e.target.value)} />
              {errors.slug && <p className="text-red-600 text-sm">{errors.slug}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium">Description</label>
              <textarea className="mt-1 w-full border rounded px-3 py-2" value={data.description} onChange={(e) => setData('description', e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium">HTML View Path (Blade)</label>
                <input className="mt-1 w-full border rounded px-3 py-2" placeholder="templates/project-summary" value={data.html_view_path} onChange={(e) => setData('html_view_path', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium">Version</label>
                <input type="number" className="mt-1 w-full border rounded px-3 py-2" value={data.version} onChange={(e) => setData('version', Number(e.target.value))} />
              </div>
              <div className="flex items-center gap-2">
                <input id="is_active" type="checkbox" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} />
                <label htmlFor="is_active" className="text-sm">Active</label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fields</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(data.fields || []).map((f, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center">
                <input className="border rounded px-2 py-1" placeholder="name" value={f.name} onChange={(e) => {
                  const fields = [...data.fields]; fields[idx].name = e.target.value; setData('fields', fields);
                }} />
                <input className="border rounded px-2 py-1" placeholder="label" value={f.label} onChange={(e) => {
                  const fields = [...data.fields]; fields[idx].label = e.target.value; setData('fields', fields);
                }} />
                <input className="border rounded px-2 py-1" placeholder="type" value={f.type} onChange={(e) => {
                  const fields = [...data.fields]; fields[idx].type = e.target.value; setData('fields', fields);
                }} />
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={!!f.required} onChange={(e) => { const fields = [...data.fields]; fields[idx].required = e.target.checked; setData('fields', fields); }} />
                  <span className="text-sm">Required</span>
                </div>
                <button type="button" className="text-red-600" onClick={() => removeField(idx)}>Remove</button>
              </div>
            ))}
            <Button type="button" onClick={addField}>Add Field</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Config JSON (status_positions, watermark, dll)</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea className="mt-1 w-full border rounded px-3 py-2 font-mono text-xs min-h-[160px]" value={data.config_json} onChange={(e) => setData('config_json', e.target.value)} placeholder='{"status_positions":{"approved":{"page":1,"x":420,"y":60},"rejected":{"page":1,"x":420,"y":60}}}' />
            {errors.config_json && <p className="text-red-600 text-sm">{errors.config_json}</p>}
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Link href={route('templates.index')}><Button type="button" variant="outline">Cancel</Button></Link>
          <Button type="submit" disabled={processing}>Save</Button>
        </div>
      </form>
    </AuthenticatedLayout>
  );
}
