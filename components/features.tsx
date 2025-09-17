import { Card, CardContent, CardDescription, CardTitle } from "./ui/card";
import { useTranslations } from "next-intl";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  icon,
}) => (
  <Card className="flex flex-col items-center p-6 shadow-xl shadow-black/30 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-400 h-full">
    <CardContent className="p-0 mb-4">
      <div className="w-full h-full flex items-center  justify-center">
        {icon}
      </div>
    </CardContent>
    <CardTitle className="text-2xl md:text-2xl font-bold text-primary mb-4 text-center">
      {title}
    </CardTitle>
    <CardDescription className="text-center">
      <span className="text-sm leading-relaxed text-balance">
        {description}
      </span>
    </CardDescription>
  </Card>
);

export function Features() {
  const t = useTranslations("Features");
  const features = [
    {
      title: t("fast-delivery"),
      description: t("fast-delivery-description"),
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="92"
          height="92"
          fill="currentColor"
          viewBox="0 0 256 256"
        >
          <path d="M255.42,117l-14-35A15.93,15.93,0,0,0,226.58,72H192V64a8,8,0,0,0-8-8H32A16,16,0,0,0,16,72V184a16,16,0,0,0,16,16H49a32,32,0,0,0,62,0h50a32,32,0,0,0,62,0h17a16,16,0,0,0,16-16V120A7.94,7.94,0,0,0,255.42,117ZM192,88h34.58l9.6,24H192ZM32,72H176v64H32ZM80,208a16,16,0,1,1,16-16A16,16,0,0,1,80,208Zm81-24H111a32,32,0,0,0-62,0H32V152H176v12.31A32.11,32.11,0,0,0,161,184Zm31,24a16,16,0,1,1,16-16A16,16,0,0,1,192,208Zm48-24H223a32.06,32.06,0,0,0-31-24V128h48Z"></path>
        </svg>
      ),
    },
    {
      title: t("24-7-support"),
      description: t("24-7-support-description"),

      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="92"
          height="92"
          fill="currentColor"
          viewBox="0 0 256 256"
        >
          <path d="M201.89,54.66A103.43,103.43,0,0,0,128.79,24H128A104,104,0,0,0,24,128v56a24,24,0,0,0,24,24H64a24,24,0,0,0,24-24V144a24,24,0,0,0-24-24H40.36A88.12,88.12,0,0,1,190.54,65.93,87.39,87.39,0,0,1,215.65,120H192a24,24,0,0,0-24,24v40a24,24,0,0,0,24,24h24a24,24,0,0,1-24,24H136a8,8,0,0,0,0,16h56a40,40,0,0,0,40-40V128A103.41,103.41,0,0,0,201.89,54.66ZM64,136a8,8,0,0,1,8,8v40a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V136Zm128,56a8,8,0,0,1-8-8V144a8,8,0,0,1,8-8h24v56Z" />
        </svg>
      ),
    },

    {
      title: t("security-guarantee"),
      description: t("security-guarantee-description"),

      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="92"
          height="92"
          fill="currentColor"
          viewBox="0 0 256 256"
        >
          <path d="M208,80H176V56a48,48,0,0,0-96,0V80H48A16,16,0,0,0,32,96V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V96A16,16,0,0,0,208,80ZM96,56a32,32,0,0,1,64,0V80H96ZM208,208H48V96H208V208Zm-68-56a12,12,0,1,1-12-12A12,12,0,0,1,140,152Z"></path>
        </svg>
      ),
    },
    {
      title: t("cheap-prices"),
      description: t("cheap-prices-description"),

      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="92"
          height="92"
          fill="currentColor"
          viewBox="0 0 256 256"
        >
          <path d="M128,88a40,40,0,1,0,40,40A40,40,0,0,0,128,88Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,152ZM240,56H16a8,8,0,0,0-8,8V192a8,8,0,0,0,8,8H240a8,8,0,0,0,8-8V64A8,8,0,0,0,240,56ZM193.65,184H62.35A56.78,56.78,0,0,0,24,145.65v-35.3A56.78,56.78,0,0,0,62.35,72h131.3A56.78,56.78,0,0,0,232,110.35v35.3A56.78,56.78,0,0,0,193.65,184ZM232,93.37A40.81,40.81,0,0,1,210.63,72H232ZM45.37,72A40.81,40.81,0,0,1,24,93.37V72ZM24,162.63A40.81,40.81,0,0,1,45.37,184H24ZM210.63,184A40.81,40.81,0,0,1,232,162.63V184Z"></path>
        </svg>
      ),
    },
  ];

  return (
    <section className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
