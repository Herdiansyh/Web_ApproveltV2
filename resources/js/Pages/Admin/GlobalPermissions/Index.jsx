import React, { useEffect, useMemo, useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, usePage } from "@inertiajs/react";
import Header from "@/Components/Header";
import Footer from "@/Components/Footer";
import { Button } from "@/Components/ui/button";
import { Card } from "@/Components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/Components/ui/table";
import { Separator } from "@/Components/ui/separator";
import Swal from "sweetalert2";

export default function Index({ subdivisions = [], permissions = {} }) {
  const { props } = usePage();
  const auth = props?.auth;

  const initialMap = useMemo(() => {
    const map = new Map();
    subdivisions.forEach((s) => {
      const p = permissions[s.id] || {};
      map.set(s.id, {
        subdivision_id: s.id,
        can_view: !!p.can_view,
        can_approve: !!p.can_approve,
        can_reject: !!p.can_reject,
        can_request_next: !!p.can_request_next,
        can_edit: !!p.can_edit,
        can_delete: !!p.can_delete,
      });
    });
    return map;
  }, [subdivisions, permissions]);

  const [permMap, setPermMap] = useState(initialMap);

  useEffect(() => {
    const flash = props?.flash;
    if (flash?.success) {
      Swal.fire({
        icon: "success",
        title: "Success",
        text: flash.success,
        timer: 2000,
        showConfirmButton: false,
      });
    }
  }, [props?.flash]);

  const toggle = (id, key) => {
    const next = new Map(permMap);
    const row = { ...(next.get(id) || {}) };
    row[key] = !row[key];
    next.set(id, row);
    setPermMap(next);
  };

  const submit = () => {
    const payload = Array.from(permMap.values());
    router.post(route("global-permissions.store"), { permissions: payload }, {
      onSuccess: () => {
        Swal.fire({
          icon: "success",
          title: "Berhasil",
          text: "Global permissions berhasil disimpan.",
          timer: 2000,
          showConfirmButton: false,
        });
      },
      onError: (errors) => {
        let msg = "Terjadi kesalahan saat menyimpan.";
        if (errors) {
          const parts = Object.values(errors).flat().filter(Boolean);
          if (parts.length) msg = parts.join("\n");
        }
        Swal.fire({
          icon: "error",
          title: "Gagal",
          text: msg,
        });
      },
    });
  };

  return (
    <AuthenticatedLayout user={auth?.user} header={<h2 className="font-semibold text-xl">Global Permissions</h2>}>
      <Head title="Global Permissions" />
      <div className="flex min-h-screen bg-background">
        <Header />
        <div className="py-12 w-full overflow-auto">
          <div className="mx-auto p-6 lg:px-8">
            <h1 className="text-2xl font-bold mb-3">Global Permissions per Subdivision</h1>
            <p className="text-sm text-gray-600 mb-6">Atur izin global untuk setiap subdivisi. Perubahan ini berlaku untuk semua workflow.</p>

            <Card className="p-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Division</TableHead>
                      <TableHead>Subdivision</TableHead>
                      <TableHead>View</TableHead>
                      <TableHead>Approve</TableHead>
                      <TableHead>Reject</TableHead>
                      <TableHead>Request Next</TableHead>
                      <TableHead>Edit</TableHead>
                      <TableHead>Delete</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subdivisions.map((s) => {
                      const p = permMap.get(s.id) || {};
                      return (
                        <TableRow key={s.id}>
                          <TableCell>{s.division?.name || s.division_id}</TableCell>
                          <TableCell>{s.name}</TableCell>
                          {[
                            "can_view",
                            "can_approve",
                            "can_reject",
                            "can_request_next",
                            "can_edit",
                            "can_delete",
                          ].map((k) => (
                            <TableCell key={k}>
                              <input
                                type="checkbox"
                                checked={!!p[k]}
                                onChange={() => toggle(s.id, k)}
                              />
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={submit}>Save Changes</Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
      <Separator className="my-10" />
      <Footer />
    </AuthenticatedLayout>
  );
}
