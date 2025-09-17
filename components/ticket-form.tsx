"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  // FormDescription, // If you need it
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toaster, toast } from "sonner";

// Define the form schema using Zod
const ticketFormSchema = z.object({
  name: z.string().optional(),
  email: z.string().email({ message: "Invalid email address." }),
  subject: z
    .string()
    .min(5, { message: "Subject must be at least 5 characters." }),
  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters." }),
  // Optional: if you want users to select status/priority
  // status: z.coerce.number().optional(), // Freshdesk uses numeric codes. Coerce converts string from select to number.
  // priority: z.coerce.number().optional(),
});

// Infer the type from the schema
type TicketFormValues = z.infer<typeof ticketFormSchema>;

// Type for the expected API success response from your /api/create-ticket
interface ApiSuccessResponse {
  id: number;
  // other fields from Freshdesk ticket object if your API route returns them
  [key: string]: any;
}

// Type for the expected API error response
interface ApiErrorResponse {
  message: string;
  details?: any;
  requestId?: string;
}

export function TicketForm() {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      name: "",
      email: "", // Consider pre-filling if user is logged in (from Supabase Auth, for example)
      subject: "",
      description: "",
      // status: 2, // Default "Open" code
      // priority: 1, // Default "Low" code
    },
  });

  async function onSubmit(values: TicketFormValues) {
    setIsLoading(true);
    const toastId = toast.loading("Submitting your ticket...");

    try {
      const response = await fetch("/api/create-ticket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      // It's good practice to type the expected response
      const result: ApiSuccessResponse | ApiErrorResponse =
        await response.json();
      toast.dismiss(toastId);

      if (response.ok) {
        toast.success("Ticket created successfully!", {
          description: `Ticket ID: ${(result as ApiSuccessResponse).id}`, // Example of using the typed response
        });
        form.reset();
        console.log("Ticket created:", result);
      } else {
        const errorResult = result as ApiErrorResponse;
        toast.error(errorResult.message || "Failed to create ticket.", {
          description:
            typeof errorResult.details === "string"
              ? errorResult.details
              : JSON.stringify(errorResult.details) ||
                (errorResult.requestId
                  ? `Request ID: ${errorResult.requestId}`
                  : ""),
        });
        console.error("Error creating ticket:", errorResult);
      }
    } catch (error) {
      toast.dismiss(toastId);
      toast.error("An unexpected error occurred. Please try again.");
      console.error("Submission error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Toaster richColors position="top-right" />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 max-w-2xl mx-auto p-6 bg-black rounded-xl"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">
                  Your Nickname (Optional)
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Jane Doe"
                    {...field}
                    className="bg-black/50 border-white/20 text-white placeholder:text-white/50 focus:border-white/50"
                  />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">
                  Email <span className="text-red-400">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    {...field}
                    className="bg-black/50 border-white/20 text-white placeholder:text-white/50 focus:border-white/50"
                  />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">
                  Subject <span className="text-red-400">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Issue with..."
                    {...field}
                    className="bg-black/50 border-white/20 text-white placeholder:text-white/50 focus:border-white/50"
                  />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">
                  Description <span className="text-red-400">*</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Please describe your issue in detail..."
                    className="min-h-[120px] bg-black/50 -white/20border text-white placeholder:text-white/50 focus:border-white/50"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          {/* Example for Status and Priority using Select (Optional) */}
          {/* Ensure Freshdesk status/priority codes are correct */}
          {/*
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value ? Number(value) : undefined)} // Handle potential empty string from Select
                    defaultValue={field.value ? String(field.value) : undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status (defaults to Open)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="2">Open</SelectItem>
                      <SelectItem value="3">Pending</SelectItem>
                      <SelectItem value="4">Resolved</SelectItem>
                      <SelectItem value="5">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value ? Number(value) : undefined)}
                    defaultValue={field.value ? String(field.value) : undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority (defaults to Low)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">Low</SelectItem>
                      <SelectItem value="2">Medium</SelectItem>
                      <SelectItem value="3">High</SelectItem>
                      <SelectItem value="4">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          */}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white hover:bg-white/90 text-black transition-colors"
          >
            {isLoading ? "Submitting..." : "Create Ticket"}
          </Button>
        </form>
      </Form>
    </>
  );
}
