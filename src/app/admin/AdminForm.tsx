"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import BrutalInput from "@/components/ui/BrutalInput"
import BrutalButton from "@/components/ui/BrutalButton"
import { addProduct } from "@/lib/api"

interface FormData {
  name: string
  tagline: string
  slug: string
  price: string
  category: string
  sku: string
}

const initialFormData: FormData = {
  name: "",
  tagline: "",
  slug: "",
  price: "",
  category: "",
  sku: "",
}

export default function AdminForm() {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError(null)
    setSuccess(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setImageFile(file)
    setError(null)
    setSuccess(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.slug || !formData.price || !formData.category || !formData.sku || !imageFile) {
      setError("All fields are required")
      return
    }
    setLoading(true)
    setError(null)
    setSuccess(false)
    try {
      await addProduct(
        {
          name: formData.name,
          tagline: formData.tagline,
          slug: formData.slug,
          sku: formData.sku,
          price: parseFloat(formData.price) * 100,
          category: formData.category,
          description: "",
        },
        imageFile
      )
      setFormData(initialFormData)
      setImageFile(null)
      setSuccess(true)
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Upload failed"
      setError(errMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 py-8 max-w-4xl mx-auto">
      <h1 className="font-mono text-4xl md:text-5xl font-bold uppercase mb-2">Admin Panel</h1>
      <p className="font-sans text-brutal-black/60 mb-6">Manage store products</p>

      <div className="flex border-brutal border-3 mb-8 overflow-hidden">
        <div className="flex-1 px-6 py-3 font-mono text-sm uppercase bg-brutal-black text-cream border-r-brutal border-r-3">Products</div>
        <a href="/admin/templates" className="flex-1 px-6 py-3 font-mono text-sm uppercase bg-cream text-brutal-black hover:bg-accent hover:text-cream transition-colors text-center border-r-brutal border-r-3">Templates</a>
        <a href="/admin/orders" className="flex-1 px-6 py-3 font-mono text-sm uppercase bg-cream text-brutal-black hover:bg-accent hover:text-cream transition-colors text-center">Orders</a>
      </div>

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-brutal border-3 border-brutal-black bg-toxic p-4 mb-8"
          style={{ boxShadow: "4px 4px 0 #0A0A0A" }}
        >
          <p className="font-mono text-sm uppercase text-brutal-black">Product added to the void successfully</p>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-brutal border-3 border-brutal-black bg-accent p-4 mb-8"
          style={{ boxShadow: "4px 4px 0 #0A0A0A" }}
        >
          <p className="font-mono text-sm uppercase text-cream">ERROR: {error}</p>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BrutalInput placeholder="Product Name" name="name" value={formData.name} onChange={handleInputChange} required />
          <BrutalInput placeholder="Tagline" name="tagline" value={formData.tagline} onChange={handleInputChange} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BrutalInput placeholder="Slug (e.g., void-tee)" name="slug" value={formData.slug} onChange={handleInputChange} required />
          <BrutalInput placeholder="Price (INR)" name="price" type="number" step="0.01" min="0" value={formData.price} onChange={handleInputChange} required />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BrutalInput placeholder="Category (e.g., Tops)" name="category" value={formData.category} onChange={handleInputChange} required />
          <BrutalInput placeholder="Product SKU" name="sku" value={formData.sku} onChange={handleInputChange} required />
        </div>
        <div>
          <label className="font-mono text-sm uppercase mb-2 block">Product Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full px-4 py-3 font-sans text-sm border-brutal border-3 border-brutal-black bg-cream file:mr-4 file:py-2 file:px-4 file:border-0 file:bg-brutal-black file:text-cream file:font-mono file:uppercase file:cursor-pointer"
            required
          />
        </div>
        <BrutalButton variant="accent" className="w-full" disabled={loading}>
          {loading ? "Uploading to the void..." : "Add Product"}
        </BrutalButton>
      </form>
    </div>
  )
}
