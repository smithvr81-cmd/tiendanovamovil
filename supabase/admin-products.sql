-- Catálogo administrable desde /admin.
-- Solo el correo administrador confirmado puede escribir; la tienda puede leer.

alter table public.admin_products enable row level security;

drop policy if exists owners_insert_admin_products on public.admin_products;
drop policy if exists owners_update_admin_products on public.admin_products;
drop policy if exists owners_delete_admin_products on public.admin_products;

create policy owners_insert_admin_products
on public.admin_products for insert to authenticated
with check (
  (select auth.uid()) = created_by
  and lower((select auth.jwt() ->> 'email')) = 'smithvr81@gmail.com'
);

create policy owners_update_admin_products
on public.admin_products for update to authenticated
using (
  (select auth.uid()) = created_by
  and lower((select auth.jwt() ->> 'email')) = 'smithvr81@gmail.com'
)
with check (
  (select auth.uid()) = created_by
  and lower((select auth.jwt() ->> 'email')) = 'smithvr81@gmail.com'
);

create policy owners_delete_admin_products
on public.admin_products for delete to authenticated
using (
  (select auth.uid()) = created_by
  and lower((select auth.jwt() ->> 'email')) = 'smithvr81@gmail.com'
);
