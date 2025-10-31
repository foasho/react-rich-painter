import type { Meta, StoryObj } from '@storybook/react';
import { ReactRichPainter } from './Painter';

const meta = {
  title: 'ReactRichPainter',
  component: ReactRichPainter,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'React Rich Painterは、Reactで統合可能な本格的なペイント機能を提供するライブラリです。マウス入力、タッチ入力、ペン入力をサポートし、レイヤー機能、ブラシ機能、スポイト機能などを備えています。',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
  argTypes: {
    autoSize: {
      control: 'boolean',
      description: '親要素のサイズから自動的にキャンバスサイズを決定するかどうか（デフォルト: true）',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: true },
      },
    },
    preset: {
      control: 'select',
      options: ['painting', 'notebook'],
      description: 'プリセット設定（painting: 通常モード、notebook: ノートブックモード）',
      table: {
        type: { summary: "'painting' | 'notebook'" },
        defaultValue: { summary: 'painting' },
      },
    },
    width: {
      control: { type: 'number', min: 100, max: 2000, step: 50 },
      description: 'キャンバスの幅（ピクセル）※autoSize=falseの場合に使用',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: 800 },
      },
    },
    height: {
      control: { type: 'number', min: 100, max: 2000, step: 50 },
      description: 'キャンバスの高さ（ピクセル）※autoSize=falseの場合に使用',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: 600 },
      },
    },
    toolbar: {
      control: 'boolean',
      description: 'ツールバーを表示するかどうか',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: true },
      },
    },
    brushbar: {
      control: 'boolean',
      description: 'ブラシバーを表示するかどうか',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: true },
      },
    },
    defaultCustomBrush: {
      control: 'boolean',
      description: 'デフォルトのカスタムブラシ（b0~b4.png）を使用するかどうか',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: true },
      },
    },
    backgroundSize: {
      control: { type: 'number', min: 5, max: 100, step: 5 },
      description: '背景タイルの大きさ（ピクセル）',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: 20 },
      },
    },
  },
} satisfies Meta<typeof ReactRichPainter>;

export default meta;
type Story = StoryObj<typeof meta>;

// デフォルトストーリー：自動サイズ
export const Default: Story = {
  args: {
    autoSize: true,
    toolbar: true,
    brushbar: true,
    defaultCustomBrush: true,
    backgroundSize: 20,
  },
  render: (args) => (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactRichPainter {...args} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'autoSize=trueのデフォルト設定です。親要素のサイズの0.8倍が自動的にキャンバスサイズとして設定されます。',
      },
    },
  },
};

// 自動サイズ：様々なコンテナサイズ
export const AutoSizeSmallContainer: Story = {
  args: {
    autoSize: true,
    toolbar: true,
    brushbar: true,
    defaultCustomBrush: true,
    backgroundSize: 20,
  },
  render: (args) => (
    <div style={{ width: '600px', height: '400px', border: '2px solid red' }}>
      <ReactRichPainter {...args} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '小さいコンテナ（600x400px）での自動サイズ調整の例です。赤い枠が親コンテナの境界です。',
      },
    },
  },
};

export const AutoSizeLargeContainer: Story = {
  args: {
    autoSize: true,
    toolbar: true,
    brushbar: true,
    defaultCustomBrush: true,
    backgroundSize: 20,
  },
  render: (args) => (
    <div style={{ width: '1400px', height: '900px', border: '2px solid blue' }}>
      <ReactRichPainter {...args} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '大きいコンテナ（1400x900px）での自動サイズ調整の例です。青い枠が親コンテナの境界です。',
      },
    },
  },
};

// 固定サイズ：標準サイズのキャンバス
export const FixedSizeDefault: Story = {
  args: {
    autoSize: false,
    width: 800,
    height: 600,
    toolbar: true,
    brushbar: true,
    defaultCustomBrush: true,
    backgroundSize: 20,
  },
  render: (args) => (
    <div style={{ width: `${args.width}px`, height: `${args.height}px` }}>
      <ReactRichPainter {...args} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'autoSize=falseで固定サイズ（800x600px）を指定した例です。',
      },
    },
  },
};

// 小さいキャンバス
export const Small: Story = {
  args: {
    autoSize: false,
    width: 400,
    height: 300,
    toolbar: true,
    brushbar: true,
    defaultCustomBrush: true,
    backgroundSize: 20,
  },
  render: (args) => (
    <div style={{ width: `${args.width}px`, height: `${args.height}px` }}>
      <ReactRichPainter {...args} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '小さいサイズのキャンバスです。モバイルやタブレットなどの小さい画面に適しています。',
      },
    },
  },
};

// 大きいキャンバス
export const Large: Story = {
  args: {
    autoSize: false,
    width: 1200,
    height: 800,
    toolbar: true,
    brushbar: true,
    defaultCustomBrush: true,
    backgroundSize: 20,
  },
  render: (args) => (
    <div style={{ width: `${args.width}px`, height: `${args.height}px` }}>
      <ReactRichPainter {...args} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '大きいサイズのキャンバスです。デスクトップの大きい画面での作業に適しています。',
      },
    },
  },
};

// 正方形キャンバス
export const Square: Story = {
  args: {
    autoSize: false,
    width: 600,
    height: 600,
    toolbar: true,
    brushbar: true,
    defaultCustomBrush: true,
    backgroundSize: 20,
  },
  render: (args) => (
    <div style={{ width: `${args.width}px`, height: `${args.height}px` }}>
      <ReactRichPainter {...args} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '正方形のキャンバスです。アイコンやプロフィール画像など、正方形の作品に適しています。',
      },
    },
  },
};

// UIなし（キャンバスのみ）
export const CanvasOnly: Story = {
  args: {
    autoSize: false,
    width: 800,
    height: 600,
    toolbar: false,
    brushbar: false,
    defaultCustomBrush: true,
    backgroundSize: 20,
  },
  render: (args) => (
    <div style={{ width: `${args.width}px`, height: `${args.height}px` }}>
      <ReactRichPainter {...args} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'ツールバーとブラシバーを非表示にした、キャンバスのみの表示です。カスタムUIを作成する場合に便利です。',
      },
    },
  },
};

// ツールバーのみ
export const WithToolbarOnly: Story = {
  args: {
    autoSize: false,
    width: 800,
    height: 600,
    toolbar: true,
    brushbar: false,
    defaultCustomBrush: true,
    backgroundSize: 20,
  },
  render: (args) => (
    <div style={{ width: `${args.width}px`, height: `${args.height}px` }}>
      <ReactRichPainter {...args} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'ツールバーのみを表示し、ブラシバーを非表示にした状態です。',
      },
    },
  },
};

// ブラシバーのみ
export const WithBrushbarOnly: Story = {
  args: {
    autoSize: false,
    width: 800,
    height: 600,
    toolbar: false,
    brushbar: true,
    defaultCustomBrush: true,
    backgroundSize: 20,
  },
  render: (args) => (
    <div style={{ width: `${args.width}px`, height: `${args.height}px` }}>
      <ReactRichPainter {...args} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'ブラシバーのみを表示し、ツールバーを非表示にした状態です。',
      },
    },
  },
};

// カスタムブラシなし
export const WithoutCustomBrush: Story = {
  args: {
    autoSize: false,
    width: 800,
    height: 600,
    toolbar: true,
    brushbar: true,
    defaultCustomBrush: false,
    backgroundSize: 20,
  },
  render: (args) => (
    <div style={{ width: `${args.width}px`, height: `${args.height}px` }}>
      <ReactRichPainter {...args} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'デフォルトのカスタムブラシを読み込まない設定です。独自のブラシセットを使用する場合に便利です。',
      },
    },
  },
};

// 細かい背景グリッド
export const FineGrid: Story = {
  args: {
    autoSize: false,
    width: 800,
    height: 600,
    toolbar: true,
    brushbar: true,
    defaultCustomBrush: true,
    backgroundSize: 10,
  },
  render: (args) => (
    <div style={{ width: `${args.width}px`, height: `${args.height}px` }}>
      <ReactRichPainter {...args} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '背景グリッドのサイズを小さくした設定です。より細かい作業に適しています。',
      },
    },
  },
};

// 粗い背景グリッド
export const CoarseGrid: Story = {
  args: {
    autoSize: false,
    width: 800,
    height: 600,
    toolbar: true,
    brushbar: true,
    defaultCustomBrush: true,
    backgroundSize: 40,
  },
  render: (args) => (
    <div style={{ width: `${args.width}px`, height: `${args.height}px` }}>
      <ReactRichPainter {...args} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '背景グリッドのサイズを大きくした設定です。大まかな作業に適しています。',
      },
    },
  },
};

// モバイル向け
export const Mobile: Story = {
  args: {
    autoSize: false,
    width: 360,
    height: 640,
    toolbar: true,
    brushbar: true,
    defaultCustomBrush: true,
    backgroundSize: 15,
  },
  render: (args) => (
    <div style={{ width: `${args.width}px`, height: `${args.height}px` }}>
      <ReactRichPainter {...args} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'モバイルデバイス向けの縦長キャンバスです。スマートフォンでの使用に適しています。',
      },
    },
  },
};

// タブレット向け
export const Tablet: Story = {
  args: {
    autoSize: false,
    width: 768,
    height: 1024,
    toolbar: true,
    brushbar: true,
    defaultCustomBrush: true,
    backgroundSize: 20,
  },
  render: (args) => (
    <div style={{ width: `${args.width}px`, height: `${args.height}px` }}>
      <ReactRichPainter {...args} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'タブレットデバイス向けのキャンバスです。iPadなどでの使用に適しています。',
      },
    },
  },
};

// ワイドスクリーン
export const Widescreen: Story = {
  args: {
    autoSize: false,
    width: 1600,
    height: 900,
    toolbar: true,
    brushbar: true,
    defaultCustomBrush: true,
    backgroundSize: 25,
  },
  render: (args) => (
    <div style={{ width: `${args.width}px`, height: `${args.height}px` }}>
      <ReactRichPainter {...args} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'ワイドスクリーン向けの16:9アスペクト比のキャンバスです。',
      },
    },
  },
};

// Notebookプリセット：フルスクリーン
export const NotebookPreset: Story = {
  args: {
    autoSize: true,
    preset: 'notebook',
    toolbar: false,
    brushbar: false,
    defaultCustomBrush: false,
    backgroundSize: 20,
  },
  render: (args) => (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactRichPainter {...args} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Notebookプリセットの例です。親要素いっぱいにキャンバスが配置され、ペン・消しゴム・ブラシサイズ・色を含むNotebookBarのみが表示されます。シンプルなメモやスケッチに適しています。',
      },
    },
  },
};

// Notebookプリセット：固定サイズ
export const NotebookPresetFixedSize: Story = {
  args: {
    autoSize: false,
    preset: 'notebook',
    width: 800,
    height: 600,
    toolbar: false,
    brushbar: false,
    defaultCustomBrush: false,
    backgroundSize: 20,
  },
  render: (args) => (
    <div style={{ width: `${args.width}px`, height: `${args.height}px` }}>
      <ReactRichPainter {...args} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Notebookプリセットで固定サイズ（800x600px）を指定した例です。簡易的なメモやスケッチに適しています。',
      },
    },
  },
};

// Notebookプリセット：タブレット向け
export const NotebookPresetTablet: Story = {
  args: {
    autoSize: false,
    preset: 'notebook',
    width: 768,
    height: 1024,
    toolbar: false,
    brushbar: false,
    defaultCustomBrush: false,
    backgroundSize: 15,
  },
  render: (args) => (
    <div style={{ width: `${args.width}px`, height: `${args.height}px` }}>
      <ReactRichPainter {...args} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Notebookプリセットをタブレット向けサイズで表示した例です。iPadなどでの手書きメモやスケッチに適しています。',
      },
    },
  },
};
