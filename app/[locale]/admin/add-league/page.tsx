"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { toast, Toaster } from "sonner";

interface League {
  name: string;
  imageUrl: string;
  gameVersion: "path-of-exile-1" | "path-of-exile-2";
  description?: string;
}

export default function AddLeague() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<League>({
    name: "",
    imageUrl: "",
    gameVersion: "path-of-exile-1",
    description: "",
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const clearForm = () => {
    setFormData({
      name: "",
      imageUrl: "",
      gameVersion: "path-of-exile-1",
      description: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Validate required fields
      if (!formData.name || !formData.imageUrl || !formData.gameVersion) {
        throw new Error("Please fill in all required fields");
      }

      // Validate game version
      if (
        !["path-of-exile-1", "path-of-exile-2"].includes(formData.gameVersion)
      ) {
        throw new Error("Invalid game version");
      }

      const { data, error } = await supabase
        .from("leagues")
        .insert([formData])
        .select();

      if (error) {
        console.error("Supabase error:", error);
        throw new Error(error.message || "Failed to add league");
      }

      if (!data || data.length === 0) {
        throw new Error("No data returned after insert");
      }

      clearForm();
      toast.success("League added successfully!");
    } catch (error) {
      console.error("Error adding league: ", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add league"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container h-min-screen pt-20">
      <Toaster
        position="bottom-right"
        theme="dark"
        className="bg-black"
        toastOptions={{
          style: {
            background: "#000",
            color: "#fff",
            border: "1px solid #333",
          },
          className: "bg-black text-white border border-gray-800",
        }}
      />
      <div className="max-w-4xl mx-auto p-8 rounded-lg shadow-lg bg-black border border-gray-800">
        <h1 className="text-3xl font-bold text-gray-slate-100 mb-8 text-center">
          Add New League
        </h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Name Input */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-300">
                League Name
              </Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="bg-black border-gray-700 text-white focus:border-gray-500"
                placeholder="Enter league name"
              />
            </div>

            {/* Image URL Input */}
            <div className="space-y-2">
              <Label htmlFor="imageUrl" className="text-gray-300">
                Image URL
              </Label>
              <Input
                id="imageUrl"
                required
                value={formData.imageUrl}
                onChange={(e) =>
                  setFormData({ ...formData, imageUrl: e.target.value })
                }
                className="bg-black border-gray-700 text-white focus:border-gray-500"
                placeholder="Enter image URL"
              />
            </div>

            {/* Game Version Select */}
            <div className="space-y-2">
              <Label className="text-gray-300">Game Version</Label>
              <Select
                value={formData.gameVersion}
                onValueChange={(value: "path-of-exile-1" | "path-of-exile-2") =>
                  setFormData({ ...formData, gameVersion: value })
                }
              >
                <SelectTrigger className="bg-black border-gray-700 text-white focus:border-gray-500">
                  <SelectValue placeholder="Select Game Version" />
                </SelectTrigger>
                <SelectContent className="bg-black border-gray-700">
                  <SelectItem value="path-of-exile-1">
                    Path of Exile 1
                  </SelectItem>
                  <SelectItem value="path-of-exile-2">
                    Path of Exile 2
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description Textarea - Full Width */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description" className="text-gray-300">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full bg-black border border-gray-700 text-white focus:border-gray-500 min-h-[100px] resize-y rounded-md p-2"
                placeholder="Enter league description"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center mt-8">
            <Button
              type="submit"
              disabled={loading}
              className="bg-white text-black hover:bg-gray-200 font-semibold py-3 px-8 rounded-md min-w-[200px]"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-black"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                "Save League"
              )}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
