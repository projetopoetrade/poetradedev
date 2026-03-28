import { Package, ShoppingBag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import { getUserOrders } from "@/app/actions";
import OrdersClient from "./OrdersClient";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function OrdersPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Orders");

  const orders = await getUserOrders();

  if (orders.length === 0) {
    return (
      <div className="container min-h-[80vh] mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 text-center md:text-left">{t("title")}</h1>
        <Card className="p-12 max-w-2xl mx-auto text-center border border-dashed">
          <div className="rounded-full bg-primary/10 p-6 mx-auto w-24 h-24 flex items-center justify-center mb-6">
            <Package className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold mb-3">{t("noOrdersYet")}</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            {t("onceYouPlaceAnOrder")}
          </p>
          <Button asChild size="lg" className="px-8 gap-2">
            <Link href="/">
              <ShoppingBag className="h-5 w-5" />
              {t("browsePoEItems")}
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  return <OrdersClient orders={orders} />;
}
