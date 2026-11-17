'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Pencil, ArchiveRestore, Trash2, ImagePlus, X, Layers, Package } from 'lucide-react';

type Category = { id: string; name: string; slug: string; description: string; is_active: boolean };
type Variant = { sku: string; size: string; color: string; colorHex: string; quantity: number };
type Product = {
  id: string; name: string; slug: string; sku: string; price: number; original_price: number | null;
  tagline: string; description: string; club: string; category_id: string | null;
  images: string[]; variants: Variant[]; features: string[]; customizable: boolean; featured: boolean; status: string;
};
const empty = { name:'', slug:'', sku:'', price:'', original_price:'', tagline:'', description:'', club:'', category_id:'', images:[] as string[], variants:[{sku:'',size:'M',color:'Black',colorHex:'#111827',quantity:0}] as Variant[], features:'', customizable:false, featured:false, status:'draft' };
function categoryCode(category: Category | undefined) {
  const raw = (category?.slug || category?.name || 'GENERAL').toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '');
  return raw.slice(0, 10) || 'GENERAL';
}
function makeProductSku(category: Category | undefined, slug: string) {
  const suffix = slug.toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 18) || 'ITEM';
  return `NITRR-${categoryCode(category)}-${suffix}`;
}
function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('Please select image files only.'));
    if (file.size > 10 * 1024 * 1024) return reject(new Error(`${file.name} exceeds the 10 MB source limit.`));
    const image = new window.Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      const max = 1800;
      const scale = Math.min(1, max / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) { URL.revokeObjectURL(url); return reject(new Error('Image compression is unavailable in this browser.')); }
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => {
        URL.revokeObjectURL(url);
        if (!blob) return reject(new Error('Could not compress image.'));
        resolve(new File([blob], file.name.replace(/\\.[^.]+$/, '') + '.webp', { type: 'image/webp' }));
      }, 'image/webp', 0.82);
    };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error(`Could not read ${file.name}.`)); };
    image.src = url;
  });
}
const field = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#ff782e] focus:ring-2 focus:ring-orange-100';
const label = 'mb-1.5 block text-xs font-bold text-slate-600';

async function responseJson(response: Response) {
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || `Request failed (${response.status})`);
  return result;
}

export default function CatalogManager() {
  const [products,setProducts] = useState<Product[]>([]);
  const [categories,setCategories] = useState<Category[]>([]);
  const [editing,setEditing] = useState<Product | null>(null);
  const [form,setForm] = useState(empty);
  const [categoryName,setCategoryName] = useState('');
  const [categorySlug,setCategorySlug] = useState('');
  const [editingCategory,setEditingCategory] = useState<Category | null>(null);
  const [showCategory,setShowCategory] = useState(false);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [notice,setNotice] = useState('');
  const [view,setView] = useState<'products'|'add'|'categories'>('products');
  const [search,setSearch] = useState('');
  const [debouncedSearch,setDebouncedSearch] = useState('');
  const [catalogPage,setCatalogPage] = useState(1);
  const catalogPageSize = 20;
  useEffect(()=>{ const timer=window.setTimeout(()=>setDebouncedSearch(search),250); return ()=>window.clearTimeout(timer); },[search]);

  async function load() {
    setError('');
    try {
      const result = await responseJson(await fetch('/api/admin/catalog',{cache:'no-store'}));
      setProducts(result.products ?? []);
      setCategories(result.categories ?? []);
    } catch(e) { setError(e instanceof Error ? e.message : 'Unable to load products'); }
  }
  useEffect(()=>{ void load(); },[]);

  function startNew() { setEditing(null); setForm({...empty, variants:[{...empty.variants[0]}]}); setNotice(''); setError(''); setView('add'); window.scrollTo({top:0,behavior:'smooth'}); }
  function startEdit(p: Product) {
    setEditing(p);
    setForm({
      name:p.name,slug:p.slug,sku:p.sku,price:String(p.price),original_price:p.original_price == null ? '' : String(p.original_price),
      tagline:p.tagline || '',description:p.description || '',club:p.club || '',category_id:p.category_id || '',
      images:p.images || [],variants:p.variants?.length ? p.variants.map(v=>({...v,sku:v.sku.startsWith(p.sku + '-') ? v.sku.slice(p.sku.length + 1) : v.sku})) : [{...empty.variants[0]}],
      features:(p.features || []).join('\n'),customizable:p.customizable,featured:p.featured,status:p.status
    });
    setError(''); setNotice(''); setView('add');
    window.scrollTo({top:0,behavior:'smooth'});
  }

  async function uploadImages(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true); setError('');
    try {
      if (form.images.length + files.length > 8) throw new Error('A product can have at most 8 images.');
      const compressed = await Promise.all(Array.from(files).map(compressImage));
      const body = new FormData();
      compressed.forEach(file=>body.append('files',file));
      const result = await responseJson(await fetch('/api/admin/catalog/images',{method:'POST',body}));
      setForm(old=>({...old,images:[...old.images,...result.urls].slice(0,8)}));
    } catch(e) { setError(e instanceof Error ? e.message : 'Image upload failed'); }
    finally { setBusy(false); }
  }

  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      if (!form.images.length) throw new Error('Upload at least one product image.');
      if (!form.variants.length || form.variants.some(v=>!v.size.trim() || !v.color.trim() || !Number.isInteger(Number(v.quantity)) || Number(v.quantity)<0)) throw new Error('Each variant needs a size, colour and valid stock quantity.');
      const payload = {
        ...form, sku: editing?.sku || makeProductSku(categories.find(c=>c.id===form.category_id),form.slug), price:Number(form.price), originalPrice:form.original_price,
        categoryId:form.category_id || null, features:form.features.split('\n').map(x=>x.trim()).filter(Boolean),
        variants:form.variants.map(v=>({...v,sku:`${editing?.sku || makeProductSku(categories.find(c=>c.id===form.category_id),form.slug)}-${v.sku.trim().toUpperCase().replace(/[^A-Z0-9-]+/g,'-') || `${v.size}-${v.color}`.toUpperCase().replace(/[^A-Z0-9-]+/g,'-')}`,quantity:Number(v.quantity)}))
      };
      const result = await responseJson(await fetch('/api/admin/catalog',{
        method:editing?'PATCH':'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify(editing?{...payload,id:editing.id,category_id:payload.categoryId,original_price:payload.originalPrice}:{...payload,categoryId:payload.categoryId,originalPrice:payload.originalPrice})
      }));
      setNotice(editing?'Product updated.':'Product saved as a catalogue item.');
      setEditing(null); setForm({...empty,variants:[{...empty.variants[0]}]}); setView('products'); await load();
    } catch(e) { setError(e instanceof Error?e.message:'Unable to save product'); }
    finally { setBusy(false); }
  }

  async function importLegacy() {
    if (!window.confirm('Import the existing storefront catalogue into the admin database? Existing product IDs and slugs are preserved. Variant quantities start at zero and existing inventory remains unchanged.')) return;
    setBusy(true); setError('');
    try {
      const result = await responseJson(await fetch('/api/admin/catalog/import-legacy', { method: 'POST' }));
      await load();
      setNotice(`${result.imported} existing products imported. Existing inventory and orders were not changed.`);
    } catch (e) { setError(e instanceof Error ? e.message : 'Catalogue import failed'); }
    finally { setBusy(false); }
  }

  async function archive(p: Product, action: 'archive'|'delete' = 'archive') {
    if (!window.confirm(action === 'delete' ? `Permanently delete "${p.name}"? This is allowed only when it is not referenced by order history.` : `Archive "${p.name}"? It will no longer be available for active catalogue management.`)) return;
    setBusy(true); setError('');
    try { await responseJson(await fetch('/api/admin/catalog',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:p.id,action})})); await load(); setNotice(action==='delete'?'Product permanently deleted.':'Product archived.'); }
    catch(e) { setError(e instanceof Error?e.message:'Unable to archive product'); }
    finally { setBusy(false); }
  }

  async function addCategory(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const result=await responseJson(await fetch('/api/admin/catalog/categories',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:categoryName,slug:categorySlug || categoryName.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-')})}));
      setCategories(old=>[...old,result.category]); setForm(old=>({...old,category_id:result.category.id}));
      setCategoryName('');setCategorySlug('');setShowCategory(false);setNotice('Category created.');
    } catch(e) { setError(e instanceof Error?e.message:'Unable to create category'); }
    finally { setBusy(false); }
  }

  function startEditCategory(category: Category) {
    setEditingCategory(category); setCategoryName(category.name); setCategorySlug(category.slug);
    setShowCategory(true); setError(''); setNotice('');
  }

  async function saveCategory(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      if (editingCategory) {
        const result = await responseJson(await fetch('/api/admin/catalog/categories', {
          method:'PATCH', headers:{'Content-Type':'application/json'},
          body:JSON.stringify({id:editingCategory.id,name:categoryName,slug:categorySlug || categoryName.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-'),description:editingCategory.description || ''})
        }));
        setCategories(old=>old.map(c=>c.id===editingCategory.id?result.category:c));
        setNotice(`Category updated. ${result.productsUpdated ?? 0} product SKU(s) regenerated.`);
      } else {
        const result=await responseJson(await fetch('/api/admin/catalog/categories',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:categoryName,slug:categorySlug || categoryName.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-')})}));
        setCategories(old=>[...old,result.category]); setForm(old=>({...old,category_id:result.category.id}));
        setNotice('Category created.');
      }
      setCategoryName('');setCategorySlug('');setShowCategory(false);setEditingCategory(null);await load();
    } catch(e) { setError(e instanceof Error?e.message:'Unable to save category'); }
    finally { setBusy(false); }
  }

  async function deleteCategory(category: Category) {
    if (category.slug.toLowerCase()==='reserve') return;
    const count=products.filter(p=>p.category_id===category.id).length;
    if (!window.confirm(`Delete "${category.name}"? ${count} product(s) will be moved to the protected Reserve category and their SKUs regenerated.`)) return;
    setBusy(true);setError('');
    try {
      const result=await responseJson(await fetch('/api/admin/catalog/categories',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:category.id})}));
      setCategories(old=>old.filter(c=>c.id!==category.id));
      await load();
      setNotice(`Category deleted. ${result.productsMovedToReserve ?? 0} product(s) moved to Reserve.`);
    } catch(e) { setError(e instanceof Error?e.message:'Unable to delete category'); }
    finally { setBusy(false); }
  }

  const filteredProducts = products.filter((p) => {
    const q = debouncedSearch.trim().toLowerCase();
    return !q || [p.name, p.sku, p.slug, p.club].some((value) => (value || '').toLowerCase().includes(q));
  });
  const visibleProducts = filteredProducts.slice((catalogPage-1)*catalogPageSize,catalogPage*catalogPageSize);

  return <div className="space-y-6 font-sans">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Store catalogue</h2>
        <p className="mt-1 text-sm text-slate-500">Manage products, variants and store categories.</p>
      </div>
      <button type="button" onClick={() => void importLegacy()} disabled={busy}
        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#ff782e] hover:text-[#e05b12] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50">
        Import existing products
      </button>
    </div>

    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}

    <div className="flex flex-wrap gap-2 border-b border-slate-200">
      {([
        ['products', `Existing products (${products.length})`],
        ['add', editing ? 'Edit product' : 'Add new product'],
        ['categories', `Categories (${categories.length})`],
      ] as const).map(([key, title]) => (
        <button key={key} type="button" onClick={() => { setView(key); setError(''); setNotice(''); }}
          className={`rounded-t-xl border-b-2 px-4 py-3 text-sm font-bold transition-all duration-200 hover:bg-orange-50 hover:text-[#e05b12] ${view === key ? 'border-[#ff782e] bg-orange-50/60 text-[#e05b12]' : 'border-transparent text-slate-500'}`}>
          {title}
        </button>
      ))}
    </div>

    {view === 'products' && <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 sm:p-5">
        <div><h3 className="text-lg font-bold text-slate-900">Existing products</h3><p className="text-xs text-slate-500">Select a product to edit its details and variants.</p></div>
        <button type="button" onClick={startNew} className="inline-flex items-center gap-2 rounded-xl bg-[#ff782e] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#e05b12] hover:shadow-lg active:translate-y-0">
          <Plus size={16}/> Add product
        </button>
      </div>
      <div className="border-b border-slate-100 p-4">
        <input value={search} onChange={e=>{setSearch(e.target.value);setCatalogPage(1);}} placeholder="Search by product name, SKU or collection…" className={field}/>
      </div>
      <div className="divide-y divide-slate-100">
        {visibleProducts.map(p=><article key={p.id} className="group flex flex-wrap items-center gap-3 p-4 transition-colors duration-150 hover:bg-orange-50/40 sm:px-5">
          {p.images?.[0]?<img src={p.images[0]} alt={p.name} className="h-16 w-16 rounded-xl border border-slate-100 object-cover"/>:<div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-100"><Package/></div>}
          <button type="button" onClick={()=>startEdit(p)} className="min-w-0 flex-1 text-left">
            <p className="truncate text-sm font-bold text-slate-900 group-hover:text-[#e05b12]">{p.name}</p>
            <p className="mt-1 truncate text-xs text-slate-500">{p.sku} · {p.club || 'General collection'} · ₹{p.price}</p>
            <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${p.status==='active'?'bg-emerald-50 text-emerald-700':p.status==='archived'?'bg-slate-100 text-slate-500':'bg-amber-50 text-amber-700'}`}>{p.status}</span>
          </button>
          <button type="button" onClick={()=>startEdit(p)} className="rounded-lg border border-slate-200 p-2 text-slate-600 transition-all hover:border-[#ff782e] hover:bg-orange-50 hover:text-[#e05b12]" aria-label={`Edit ${p.name}`}><Pencil size={16}/></button>
          {p.status!=='archived'&&<button type="button" onClick={()=>void archive(p,'archive')} disabled={busy} title="Archive product" className="rounded-lg border border-slate-200 p-2 text-amber-600 transition-all hover:border-amber-200 hover:bg-amber-50 disabled:opacity-50" aria-label={`Archive ${p.name}`}><ArchiveRestore size={16}/></button>}
          <button type="button" onClick={()=>void archive(p,'delete')} disabled={busy} title="Delete permanently (only if not in order history)" className="rounded-lg border border-red-100 p-2 text-red-600 transition-all hover:bg-red-50 disabled:opacity-50" aria-label={`Delete ${p.name}`}><Trash2 size={16}/></button>
        </article>)}
        {visibleProducts.length===0&&<p className="p-10 text-center text-sm text-slate-500">{products.length===0?'No catalogue products yet. Use Import existing products to bring in the current storefront catalogue.':'No products match your search.'}</p>}
      </div>
      {filteredProducts.length>catalogPageSize&&<div className="flex items-center justify-between border-t border-slate-100 p-3"><span className="text-xs text-slate-500">Page {catalogPage} of {Math.ceil(filteredProducts.length/catalogPageSize)} · {filteredProducts.length} products</span><div className="flex gap-2"><button type="button" disabled={catalogPage===1} onClick={()=>setCatalogPage(p=>Math.max(1,p-1))} className="rounded-lg border px-3 py-2 text-xs font-bold disabled:opacity-40">Previous</button><button type="button" disabled={catalogPage*catalogPageSize>=filteredProducts.length} onClick={()=>setCatalogPage(p=>p+1)} className="rounded-lg border px-3 py-2 text-xs font-bold disabled:opacity-40">Next</button></div></div>}
    </section>}

    {view === 'add' && <form onSubmit={save} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h3 className="text-lg font-bold text-slate-900">{editing?'Edit product':'Add a new product'}</h3><p className="text-xs text-slate-500">Complete the product details, images and size/colour stock.</p></div>
        <button type="button" onClick={()=>{setView('products');setEditing(null);setError('');}} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50">Close form</button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label><span className={label}>Product name *</span><input className={field} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/></label>
        <label><span className={label}>SKU *</span><input className={`${field} bg-slate-50 font-mono`} value={editing?.sku || makeProductSku(categories.find(c=>c.id===form.category_id),form.slug)} readOnly aria-label="Automatically generated product SKU"/><span className="mt-1 block text-[10px] text-slate-500">Generated from category and URL slug. Locked after product creation.</span></label>
        <label><span className={label}>URL slug *</span><input className={field} value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})} required/></label>
        <label><span className={label}>Club / collection</span><input className={field} value={form.club} onChange={e=>setForm({...form,club:e.target.value})}/></label>
        <label><span className={label}>Selling price (₹) *</span><input className={field} type="number" min="0" step="1" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} required/></label>
        <label><span className={label}>Original price (₹)</span><input className={field} type="number" min="0" step="1" value={form.original_price} onChange={e=>setForm({...form,original_price:e.target.value})}/></label>
        <label className="md:col-span-2"><span className={label}>Tagline</span><input className={field} value={form.tagline} onChange={e=>setForm({...form,tagline:e.target.value})}/></label>
        <label className="md:col-span-2"><span className={label}>Full description</span><textarea rows={4} className={field} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
        <label><span className={label}>Category</span><select className={field} value={form.category_id} onChange={e=>setForm({...form,category_id:e.target.value})}><option value="">Uncategorised</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label><span className={label}>Status</span><select className={field} value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="draft">Draft</option><option value="active">Active</option><option value="archived">Archived</option></select></label>
        <label className="md:col-span-2"><span className={label}>Features (one per line)</span><textarea rows={3} className={field} value={form.features} onChange={e=>setForm({...form,features:e.target.value})}/></label>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between"><span className={label}>Product images (up to 8)</span><label className="cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold transition hover:border-[#ff782e] hover:bg-orange-50"><ImagePlus className="mr-1 inline" size={14}/> Upload images<input type="file" accept="image/*" multiple className="hidden" onChange={e=>void uploadImages(e.target.files)}/></label></div>
        <div className="flex flex-wrap gap-3">{form.images.map((url,i)=><div key={url} className="relative"><img src={url} alt={`Product ${i+1}`} className="h-20 w-20 rounded-lg border object-cover"/><button type="button" onClick={()=>setForm({...form,images:form.images.filter((_,n)=>n!==i)})} className="absolute -right-2 -top-2 rounded-full bg-slate-900 p-1 text-white transition hover:bg-red-600"><X size={12}/></button></div>)}</div>
      </div>
      <div><div className="mb-2 flex items-center justify-between"><span className={label}>Size and colour variants</span><button type="button" onClick={()=>setForm({...form,variants:[...form.variants,{sku:'',size:'M',color:'Black',colorHex:'#111827',quantity:0}]})} className="text-xs font-bold text-[#e05b12] transition hover:text-orange-700"><Plus size={14} className="mr-1 inline"/> Add variant</button></div>
        <div className="space-y-2">{form.variants.map((v,i)=><div key={i} className="grid gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-[1fr_1fr_1fr_90px_auto]">
          <div className="min-w-0"><div className="mb-1 truncate font-mono text-[10px] text-slate-500">{editing?.sku || makeProductSku(categories.find(c=>c.id===form.category_id),form.slug)}-</div><input aria-label="Variant SKU suffix" className={field} placeholder="Variant suffix (e.g. M-BLK)" value={v.sku} onChange={e=>setForm({...form,variants:form.variants.map((x,n)=>n===i?{...x,sku:e.target.value}:x)})}/></div>
          <input aria-label="Size" className={field} placeholder="Size e.g. L" value={v.size} onChange={e=>setForm({...form,variants:form.variants.map((x,n)=>n===i?{...x,size:e.target.value}:x)})}/>
          <input aria-label="Colour" className={field} placeholder="Colour" value={v.color} onChange={e=>setForm({...form,variants:form.variants.map((x,n)=>n===i?{...x,color:e.target.value}:x)})}/>
          <input aria-label="Stock quantity" className={field} type="number" min="0" placeholder="Stock" value={v.quantity} onChange={e=>setForm({...form,variants:form.variants.map((x,n)=>n===i?{...x,quantity:Number(e.target.value)}:x)})}/>
          <button type="button" aria-label="Remove variant" onClick={()=>setForm({...form,variants:form.variants.filter((_,n)=>n!==i)})} className="rounded-lg px-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"><X size={17}/></button>
        </div>)}</div>
      </div>
      <div className="flex flex-wrap gap-5 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={form.featured} onChange={e=>setForm({...form,featured:e.target.checked})}/> Featured product</label><label className="flex items-center gap-2"><input type="checkbox" checked={form.customizable} onChange={e=>setForm({...form,customizable:e.target.checked})}/> Customizable</label></div>
      <div className="flex flex-wrap gap-2"><button disabled={busy} className="rounded-xl bg-[#ff782e] px-5 py-2.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[#e05b12] hover:shadow-md active:translate-y-0 disabled:opacity-50">{busy?'Saving…':editing?'Save changes':'Save product'}</button><button type="button" onClick={()=>{setForm({...empty,variants:[{...empty.variants[0]}]});setEditing(null);}} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50">Clear form</button></div>
    </form>}

    {view === 'categories' && <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-lg font-bold text-slate-900">Store categories</h3><p className="text-xs text-slate-500">Categories available for assigning products.</p></div><button type="button" onClick={()=>{setEditingCategory(null);setCategoryName('');setCategorySlug('');setShowCategory(v=>!v);}} className="inline-flex items-center gap-2 rounded-xl bg-[#ff782e] px-4 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#e05b12] hover:shadow-md"><Plus size={16}/> Create category</button></div>
      {showCategory && <form onSubmit={saveCategory} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_1fr_auto]"><input className={field} placeholder="Category name" value={categoryName} onChange={e=>setCategoryName(e.target.value)} required/><input className={field} placeholder="Slug (optional)" value={categorySlug} onChange={e=>setCategorySlug(e.target.value)}/><button disabled={busy} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-700 disabled:opacity-50">{editingCategory ? 'Update category' : 'Save category'}</button><button type="button" onClick={()=>{setShowCategory(false);setEditingCategory(null);setCategoryName('');setCategorySlug('');}} className="rounded-xl border px-4 py-2 text-sm font-bold">Cancel</button></form>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{categories.map(category=><article key={category.id} className="rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"><div className="flex items-start justify-between gap-3"><div><h4 className="font-bold text-slate-900">{category.name}</h4><p className="mt-1 text-xs text-slate-500">/{category.slug}</p></div><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${category.is_active===false?'bg-slate-100 text-slate-500':'bg-emerald-50 text-emerald-700'}`}>{category.is_active===false?'Inactive':'Active'}</span></div><p className="mt-3 text-xs text-slate-500">{products.filter(p=>p.category_id===category.id).length} products assigned</p><div className="mt-4 flex gap-2 border-t border-slate-100 pt-3"><button type="button" onClick={()=>startEditCategory(category)} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-bold text-slate-700 hover:border-orange-300"><Pencil size={13}/> Edit</button>{category.slug.toLowerCase()!=='reserve'&&<button type="button" disabled={busy} onClick={()=>void deleteCategory(category)} className="inline-flex items-center gap-1 rounded-lg border border-red-100 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"><Trash2 size={13}/> Delete → Reserve</button>}</div></article>)}
      {categories.length===0&&<p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">No categories yet. Create your first category.</p>}</div>
    </section>}
  </div>;
}
