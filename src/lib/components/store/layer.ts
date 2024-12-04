import { create } from 'zustand';

type Layer = {
  id: number;
  name: string;
  visible: boolean;
  opacity: number;
};

type LayerState = {
  layers: Layer[];
  selectedLayerId: number | null;
  addLayer: (layer: Layer) => void;
  removeLayer: (layerId: number) => void;
  selectLayer: (layerId: number) => void;
  toggleLayerVisibility: (layerId: number) => void;
  setLayerOpacity: (layerId: number, opacity: number) => void;
};

export const useLayerStore = create<LayerState>((set, get) => ({
  layers: [],
  selectedLayerId: null,
  addLayer: (layer) => set((state) => ({ layers: [...state.layers, layer] })),
  removeLayer: (layerId) =>
    set((state) => ({
      layers: state.layers.filter((layer) => layer.id !== layerId),
    })),
  selectLayer: (layerId) => set({ selectedLayerId: layerId }),
  toggleLayerVisibility: (layerId) =>
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
      ),
    })),
  setLayerOpacity: (layerId, opacity) =>
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === layerId ? { ...layer, opacity } : layer
      ),
    })),
}));
