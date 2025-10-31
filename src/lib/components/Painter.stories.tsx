// @ts-nocheck
import type { Meta, StoryObj } from '@storybook/react';
import { ReactRichPainter } from './Painter';

const meta: Meta = {
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
    showFileMenu: {
      control: 'boolean',
      description: 'FileMenuを表示するかどうか（Import/Export機能）',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
  },
} satisfies Meta<typeof ReactRichPainter>;

export default meta;
type Story = StoryObj<typeof meta>;

// Paintingプリセット（デフォルト）：自動サイズ
export const PaintingDefault: Story = {
  args: {
    autoSize: true,
    preset: 'painting',
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
        story: 'Paintingプリセットのデフォルト設定です。フル機能（ToolBar、BrushBar、レイヤーパネル）が使用できます。親要素のサイズの0.8倍が自動的にキャンバスサイズとして設定されます。',
      },
    },
  },
};

// Notebookプリセット
export const NotebookDefault: Story = {
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


// Paintingプリセット：固定サイズ
export const PaintingFixedSize: Story = {
  args: {
    autoSize: false,
    preset: 'painting',
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
        story: 'Paintingプリセットで固定サイズ（800x600px）を指定した例です。',
      },
    },
  },
};

// Paintingプリセット with FileMenu
export const PaintingWithFileMenu: Story = {
  args: {
    autoSize: true,
    preset: 'painting',
    toolbar: true,
    brushbar: true,
    defaultCustomBrush: true,
    backgroundSize: 20,
    showFileMenu: true,
  },
  render: (args) => (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactRichPainter {...args} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'FileMenuを表示してImport/Export機能を使用できます。ToolBarの左側にFileアイコンが表示され、クリックすると「ファイルを開く」「エクスポート」「画像を保存」のメニューが表示されます。描画状態をJSONファイルとして保存・復元できます。',
      },
    },
  },
};

// Notebookプリセット with FileMenu
export const NotebookWithFileMenu: Story = {
  args: {
    autoSize: true,
    preset: 'notebook',
    toolbar: false,
    brushbar: false,
    defaultCustomBrush: false,
    backgroundSize: 20,
    showFileMenu: true,
  },
  render: (args) => (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactRichPainter {...args} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'NotebookプリセットでもFileMenuを使用できます。NotebookBarの上部にFileアイコンが表示され、同様にImport/Export機能が利用可能です。シンプルなノート環境でも作業の保存・復元が可能です。',
      },
    },
  },
};

