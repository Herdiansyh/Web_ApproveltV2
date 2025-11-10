import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/Components/ui/card';

export default function CreateFromTemplate({ template }) {
  const { data, setData, post, processing, errors } = useForm({
    template_id: template.id,
    title: '',
    description: '',
    data: Object.fromEntries((template.fields || []).map(f => [f.name, ''])),
  });

  const submit = (e) => {
    e.preventDefault();
    post(route('submissions.storeFromTemplate'));
  };

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold">Buat dari Template: {template.name}</h2>}>
      <Head title={`Buat dari ${template.name}`} />
      <form onSubmit={submit} className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Pengajuan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Judul</label>
              <input className="mt-1 w-full border rounded px-3 py-2" value={data.title} onChange={(e) => setData('title', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium">Deskripsi</label>
              <textarea className="mt-1 w-full border rounded px-3 py-2" value={data.description} onChange={(e) => setData('description', e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Isi Field</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {template.fields?.map((f) => (
              <div key={f.id || f.name}>
                <label className="block text-sm font-medium">{f.label} ({f.type}) {f.required ? '*' : ''}</label>
                {f.type === 'textarea' ? (
                  <textarea className="mt-1 w-full border rounded px-3 py-2" value={data.data[f.name] ?? ''} onChange={(e) => setData('data', { ...data.data, [f.name]: e.target.value })} />
                ) : (
                  <input className="mt-1 w-full border rounded px-3 py-2" value={data.data[f.name] ?? ''} onChange={(e) => setData('data', { ...data.data, [f.name]: e.target.value })} />
                )}
                {errors[`data.${f.name}`] && <p className="text-red-600 text-sm">{errors[`data.${f.name}`]}</p>}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Link href={route('submissions.index')}><Button type="button" variant="outline">Batal</Button></Link>
          <Button type="submit" disabled={processing}>Buat Pengajuan</Button>
        </div>
      </form>
    </AuthenticatedLayout>
  );
}
