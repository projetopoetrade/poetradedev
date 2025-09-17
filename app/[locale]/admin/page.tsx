'use client'
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { newProduct } from "@/app/actions";
import type { Product } from "@/lib/interface";
import { toast, Toaster } from "sonner";

export default function Admin() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Product>({
    name: "",
    league: "",                                                                   
    category: "",
    slug: "",
    description: "",
    price: 0,
    gameVersion: "path-of-exile-1",
    imgUrl: "",
    difficulty: "",
    alt: "",
  });

  const generateSlug = (name: string, gameVersion: string, league: string, difficulty: string) => {
    return `${name}-${gameVersion}-${league}-${difficulty}`
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  };

  const clearForm = () => {
    setFormData({
      name: "",
      league: "",
      slug: "",
      category: "",
      description: "",
      price: 0,
      gameVersion: "path-of-exile-1",
      imgUrl: "",
      difficulty: "", 
      alt: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await newProduct(formData);
      clearForm();
      toast.success('Product added successfully!');
    } catch (error) {
      console.error("Error adding product: ", error);
      toast.error('Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container h-min-screen py-12">
      <Toaster 
        position="bottom-right" 
        theme="dark"
        className="bg-black"
        toastOptions={{
          style: {
            background: '#000',
            color: '#fff',
            border: '1px solid #333',
          },
          className: 'bg-black text-white border border-gray-800',
        }}
      />
      <div className="max-w-4xl mx-auto p-8 rounded-lg shadow-lg bg-black border border-gray-800">
        <h1 className="text-3xl font-bold text-gray-slate-100 mb-8 text-center">Add New Product</h1>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Name Input */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-300">Product Name</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => {
                  const newName = e.target.value;
                  setFormData({ 
                    ...formData, 
                    name: newName,
                    slug: generateSlug(newName, formData.gameVersion, formData.league, formData.difficulty)
                  });
                }}
                className="bg-black border-gray-700 text-white focus:border-gray-500"
                placeholder="Enter product name"
              />
            </div>

            {/* League Input */}
            <div className="space-y-2">
              <Label htmlFor="league" className="text-gray-300">League Name</Label>
              <Input
                id="league"
                required
                value={formData.league}
                onChange={(e) => {
                  const newLeague = e.target.value;
                  setFormData({ 
                    ...formData, 
                    league: newLeague,
                    slug: generateSlug(formData.name, formData.gameVersion, newLeague, formData.difficulty)
                  });
                }}
                className="bg-black border-gray-700 text-white focus:border-gray-500"
                placeholder="Enter league name"
              />
            </div>
            {/* Slug Input */}
            <div className="space-y-2">
              <Label htmlFor="slug" className="text-gray-300">Slug</Label>
              <Input
                id="slug"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="bg-black border-gray-700 text-white focus:border-gray-500"
                placeholder="Auto-generated slug"
                readOnly
              />
            </div>

            {/* Price Input */}
            <div className="space-y-2">
              <Label htmlFor="price" className="text-gray-300">Price</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <Input
                  id="price"
                  type="number"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="bg-black border-gray-700 text-white focus:border-gray-500 pl-7"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Image URL Input */}
            <div className="space-y-2">
              <Label htmlFor="imgUrl" className="text-gray-300">Image URL</Label>
              <Input
                id="imgUrl"
                required
                value={formData.imgUrl}
                onChange={(e) => setFormData({ ...formData, imgUrl: e.target.value })}
                className="bg-black border-gray-700 text-white focus:border-gray-500"
                placeholder="Enter image URL"
              />
            </div>

            {/* Game Version Select */}
            <div className="space-y-2">
              <Label className="text-gray-300">Game Version</Label>
              <Select
                value={formData.gameVersion as "path-of-exile-1" | "path-of-exile-2"}
                onValueChange={(value: "path-of-exile-1" | "path-of-exile-2") => {
                  setFormData({ 
                    ...formData, 
                    gameVersion: value,
                    slug: generateSlug(formData.name, value, formData.league, formData.difficulty)
                  });
                }}
              >
                <SelectTrigger className="bg-black border-gray-700 text-white focus:border-gray-500">
                  <SelectValue placeholder="Select Game Version" />
                </SelectTrigger>
                <SelectContent className="bg-black border-gray-700">
                  <SelectItem value="path-of-exile-1">Path of Exile 1</SelectItem>
                  <SelectItem value="path-of-exile-2">Path of Exile 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category Select */}
            <div className="space-y-2">
              <Label className="text-gray-300">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="bg-black border-gray-700 text-white focus:border-gray-500">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent className="bg-black border-gray-700">
                  <SelectItem value="currency">Currency</SelectItem>
                  <SelectItem value="services">Services</SelectItem>
                  <SelectItem value="items">Items</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Difficulty Select */}
            <div className="space-y-2">
              <Label className="text-gray-300">Difficulty</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value) => {
                  setFormData({ 
                    ...formData, 
                    difficulty: value,
                    slug: generateSlug(formData.name, formData.gameVersion, formData.league, value)
                  });
                }}
              >
                <SelectTrigger className="bg-black border-gray-700 text-white focus:border-gray-500">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent className="bg-black border-gray-700">
                  <SelectItem value="softcore">Softcore</SelectItem>
                  <SelectItem value="hardcore">Hardcore</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="alt" className="text-gray-300">Alt Image</Label>
              <Textarea
                id="alt"
                value={formData.alt}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, alt: e.target.value })}
                className="w-full bg-black border border-gray-700 text-white focus:border-gray-500 min-h-[100px] resize-y rounded-md p-2"
                placeholder="Enter product Alt Image"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button
              type="submit"
              disabled={loading}
              className="bg-white text-black hover:bg-gray-200 font-semibold py-3 px-8 rounded-md min-w-[200px]"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                "Save Product"
              )}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}