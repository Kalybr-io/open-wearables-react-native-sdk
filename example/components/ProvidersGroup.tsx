import OpenWearablesHealthSDK from "open-wearables";
import { HealthDataProvider } from "open-wearables";
import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { Group } from "./Group";
import { OptionSelector, SelectorOption } from "./OptionSelector";

interface ProvidersGroupProps {
  savedProvider: string | null;
  onProviderChange?: () => void;
}

const PROVIDER_META: Record<
  string,
  { iconName: string; iconBgColor: string; description: string }
> = {
  apple: {
    iconName: "logo-apple",
    iconBgColor: "#FF2D55",
    description: "Health Kit on iPhone and Apple Watch",
  },
  samsung: {
    iconName: "phone-portrait-outline",
    iconBgColor: "#00B140",
    description: "Samsung devices with Samsung Health",
  },
  google: {
    iconName: "heart-outline",
    iconBgColor: "#4A35C8",
    description: "Universal Android health hub",
  },
};

function getProviderMeta(provider: HealthDataProvider) {
  const byId = PROVIDER_META[provider.id];
  if (byId) return byId;

  return {
    iconName: "heart-outline",
    iconBgColor: "#3A3A3C",
    description: "Unknown provider",
  };
}

export function ProvidersGroup({
  savedProvider,
  onProviderChange,
}: ProvidersGroupProps) {
  const [providers, setProviders] = useState<HealthDataProvider[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setProviders(OpenWearablesHealthSDK.getAvailableProviders());
  }, []);

  useEffect(() => {
    setSelectedId(savedProvider);
  }, [savedProvider]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    const changed = OpenWearablesHealthSDK.setProvider(id);
    if (changed) {
      onProviderChange?.();
    } else {
      Alert.alert("Set provider error, check log");
    }
  };

  if (providers.length === 0) return null;

  const options: SelectorOption[] = providers.map((p) => {
    const meta = getProviderMeta(p);
    return {
      id: p.id,
      title: p.displayName,
      description: meta.description,
      disabled: !p.isAvailable,
      iconName: meta.iconName,
      iconBgColor: meta.iconBgColor,
    };
  });

  return (
    <Group
      name="Health Provider"
      description="Select where to read health data from"
    >
      <OptionSelector
        options={options}
        selectedId={selectedId}
        onSelect={handleSelect}
      />
    </Group>
  );
}
