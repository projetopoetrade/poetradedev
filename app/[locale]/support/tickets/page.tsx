import { TicketForm } from '@/components/ticket-form';

export default function CreateTicketPage() {
  return (
    <div className="container mx-auto py-14 min-h-[80vh]">
      <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">New Support Ticket</h1>

          <TicketForm />
        </div>
      </div>

  );
} 