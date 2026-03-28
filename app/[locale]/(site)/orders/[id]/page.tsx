import { XCircle, Package } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import { getOrderById } from "@/app/actions";
import OrderDetailsClient from "./OrderDetailsClient";

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export default async function OrderDetailsPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Orders");

  const order = await getOrderById(id);

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="p-12 max-w-2xl mx-auto text-center border border-dashed">
          <div className="rounded-full bg-red-100 dark:bg-red-950/50 p-6 mx-auto w-24 h-24 flex items-center justify-center mb-6">
            <XCircle className="h-12 w-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-semibold mb-3">{t("orderNotFound")}</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            {t("orderNotFoundDescription")}
          </p>
          <Button asChild size="lg" className="px-8 gap-2">
            <Link href="/orders">
              <Package className="h-5 w-5" />
              {t("viewAllOrders")}
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  return <OrderDetailsClient order={order} />;
}
