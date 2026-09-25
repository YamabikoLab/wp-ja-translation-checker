/**
 * WordPress.org 日本語 Glossary の静的スナップショットを保持する。
 *
 * ブラウザー実行時の外部通信を避けるため、開発者が `npm run glossary:update` を実行したときだけ
 * 公式 Glossary から再生成し、製品コードはこの確定済みデータだけを参照する。
 */

import type { GlossaryEntry } from './glossary'

/** WordPress.org 日本語 Glossary から生成した検証用データ。 */
export const JAPANESE_GLOSSARY: readonly GlossaryEntry[] = [
  {
    original: 'ability',
    translation: 'アビリティ',
    partOfSpeech: 'noun',
    comment: 'Abilities API は英語ママ',
  },
  {
    original: 'action hook',
    translation: 'アクションフック',
    partOfSpeech: 'noun',
  },
  {
    original: 'activate',
    translation: '有効化',
    partOfSpeech: 'verb',
    comment: 'ボタンなどに使う場合',
  },
  {
    original: 'activate',
    translation: '有効化する',
    partOfSpeech: 'verb',
    comment: '文章内で使う場合',
  },
  {
    original: 'activated',
    translation: '有効化した',
    partOfSpeech: 'adjective',
  },
  {
    original: 'activated',
    translation: '有効化済み',
    partOfSpeech: 'adjective',
  },
  {
    original: 'admin bar',
    translation: '管理バー',
    partOfSpeech: 'noun',
  },
  {
    original: 'admin panel',
    translation: '管理画面',
    partOfSpeech: 'noun',
  },
  {
    original: 'administrator',
    translation: '管理者',
    partOfSpeech: 'noun',
  },
  {
    original: 'advanced settings',
    translation: '高度な設定',
    partOfSpeech: 'noun',
  },
  {
    original: 'After the Deadline',
    translation: 'After the Deadline',
    partOfSpeech: 'noun',
    comment: 'Automattic のサービス名。参照: http://www.afterthedeadline.com/',
  },
  {
    original: 'all',
    translation: 'すべて',
    partOfSpeech: 'adjective',
    comment: '※「全て」ではなく、ひらがな書きにする。',
  },
  {
    original: 'already',
    translation: 'すでに',
    partOfSpeech: 'adverb',
    comment: '「既に」としない。',
  },
  {
    original: 'Appearance',
    translation: '外観',
    partOfSpeech: 'noun',
    comment: '管理画面メニュー項目',
  },
  {
    original: 'archive',
    translation: 'アーカイブ',
    partOfSpeech: 'noun',
  },
  {
    original: 'archive',
    translation: 'アーカイブ化',
    partOfSpeech: 'verb',
  },
  {
    original: 'Are you sure',
    translation: '本当に〜してもよいですか ?',
    partOfSpeech: 'expression',
    comment:
      '文頭に「本当に」、文末に「してもよいですか ?」\nAre you sure you want to delete the settings? → 本当に設定を削除してもよいですか ?',
  },
  {
    original: 'area',
    translation: 'エリア',
    partOfSpeech: 'noun',
    comment: '「ウィジェットエリア」など。',
  },
  {
    original: 'argument',
    translation: '引数',
    partOfSpeech: 'noun',
  },
  {
    original: 'array',
    translation: '配列',
    partOfSpeech: 'noun',
  },
  {
    original: 'attachment',
    translation: '添付ファイル',
    partOfSpeech: 'noun',
  },
  {
    original: 'audio',
    translation: '音声ファイル',
    partOfSpeech: 'noun',
  },
  {
    original: 'author',
    translation: '作成者',
    partOfSpeech: 'noun',
    comment: 'テーマ・プラグインの作者',
  },
  {
    original: 'Author',
    translation: '投稿者',
    partOfSpeech: 'noun',
    comment: 'ブログ投稿またはコメントを作成したユーザー',
  },
  {
    original: 'Authorization header',
    translation: 'Authorization ヘッダー',
    partOfSpeech: 'noun',
  },
  {
    original: 'binary',
    translation: 'バイナリ',
    partOfSpeech: 'noun',
  },
  {
    original: 'block',
    translation: 'ブロック',
    partOfSpeech: 'noun',
    comment: 'Gutenberg のコンテンツユニット',
  },
  {
    original: 'block type',
    translation: 'ブロックタイプ',
    partOfSpeech: 'noun',
    comment: 'Gutenberg 用語',
  },
  {
    original: 'bookmarklet',
    translation: 'ブックマークレット',
    partOfSpeech: 'noun',
  },
  {
    original: 'border',
    translation: '枠線',
    partOfSpeech: 'noun',
  },
  {
    original: 'browser',
    translation: 'ブラウザー',
    partOfSpeech: 'noun',
  },
  {
    original: 'BuddyPress',
    translation: 'BuddyPress',
    partOfSpeech: 'noun',
  },
  {
    original: 'Bulk Actions',
    translation: '一括操作',
    partOfSpeech: 'noun',
  },
  {
    original: 'bullet list',
    translation: '箇条書きリスト',
    partOfSpeech: 'noun',
    comment: 'HTML 要素',
  },
  {
    original: 'capability',
    translation: '権限',
    partOfSpeech: 'noun',
    comment:
      '参照: https://ja.wordpress.org/support/article/roles-and-capabilities/',
  },
  {
    original: 'cart',
    translation: 'お買い物カゴ',
    partOfSpeech: 'noun',
  },
  {
    original: 'cart',
    translation: 'カート',
    partOfSpeech: 'noun',
  },
  {
    original: 'category',
    translation: 'カテゴリー',
    partOfSpeech: 'noun',
    comment: '例外で長音付き',
  },
  {
    original: 'CDN',
    translation: 'CDN',
    partOfSpeech: 'noun',
    comment: 'Content Delivery Network の略語',
  },
  {
    original: 'character code',
    translation: '文字コード',
    partOfSpeech: 'noun',
  },
  {
    original: 'character entity reference',
    translation: '文字実体参照',
    partOfSpeech: 'noun',
  },
  {
    original: 'character set',
    translation: '文字セット',
    partOfSpeech: 'noun',
  },
  {
    original: 'checkout',
    translation: '購入手続き',
    partOfSpeech: 'noun',
    comment:
      'eコマースサイトでお買い物カゴに入っている商品を実際に購入する操作。',
  },
  {
    original: 'citation',
    translation: '引用元',
    partOfSpeech: 'noun',
    comment: 'blockquote 要素の属性',
  },
  {
    original: 'Classic',
    translation: 'クラシック',
    partOfSpeech: 'adjective',
    comment: 'Gutenberg のブロックタイプ',
  },
  {
    original: 'Classic Editor',
    translation: 'Classic Editor',
    partOfSpeech: 'noun',
    comment: 'プラグイン名',
  },
  {
    original: 'Classic Editor',
    translation: '旧エディター',
    partOfSpeech: 'noun',
    comment: 'エディターの種類',
  },
  {
    original: 'Code Editor',
    translation: 'コードエディター',
    partOfSpeech: 'noun',
    comment: 'HTML を編集するタイプのエディターツール',
  },
  {
    original: 'color scheme',
    translation: '配色',
    partOfSpeech: 'noun',
  },
  {
    original: 'comment',
    translation: 'コメント',
    partOfSpeech: 'noun',
  },
  {
    original: 'comment',
    translation: 'コメントする',
    partOfSpeech: 'verb',
  },
  {
    original: 'computer',
    translation: 'コンピューター',
    partOfSpeech: 'noun',
  },
  {
    original: 'conditional tag',
    translation: '条件分岐タグ',
    partOfSpeech: 'noun',
  },
  {
    original: 'constant',
    translation: '定数',
    partOfSpeech: 'noun',
  },
  {
    original: 'contact form',
    translation: 'お問い合わせフォーム',
    partOfSpeech: 'noun',
  },
  {
    original: 'container',
    translation: 'コンテナ',
    partOfSpeech: 'noun',
  },
  {
    original: 'content',
    translation: 'コンテンツ',
    partOfSpeech: 'noun',
  },
  {
    original: 'Content Delivery Network',
    translation: 'コンテンツデリバリーネットワーク',
    partOfSpeech: 'noun',
  },
  {
    original: 'Contributor',
    translation: '寄稿者',
    partOfSpeech: 'expression',
    comment:
      '権限グループのひとつ。参照: https://wpdocs.osdn.jp/Roles_and_Capabilities',
  },
  {
    original: 'contributor',
    translation: 'コントリビューター',
    partOfSpeech: 'noun',
  },
  {
    original: 'contributor',
    translation: '貢献者',
    partOfSpeech: 'noun',
  },
  {
    original: 'Cookie',
    translation: 'Cookie',
    partOfSpeech: 'noun',
    comment: 'ブラウザの Cookie',
  },
  {
    original: 'credentials',
    translation: 'ログイン情報',
    partOfSpeech: 'noun',
    comment:
      'ユーザー名とパスワードのセットなどアクセスに必要な一連の情報。コンテキストによっては「認証情報」を指すこともある',
  },
  {
    original: 'credentials',
    translation: '認証情報',
    partOfSpeech: 'noun',
    comment: '"API Credentials" などのような場合。',
  },
  {
    original: 'Custom Post Type',
    translation: 'カスタム投稿タイプ',
    partOfSpeech: 'noun',
  },
  {
    original: 'customize',
    translation: 'カスタマイズ',
    partOfSpeech: 'verb',
  },
  {
    original: 'customizer',
    translation: 'カスタマイザー',
    partOfSpeech: 'noun',
  },
  {
    original: 'Dashboard',
    translation: 'ダッシュボード',
    partOfSpeech: 'noun',
  },
  {
    original: 'Data Erasure Request',
    translation: 'データ消去リクエスト',
    partOfSpeech: 'noun',
  },
  {
    original: 'deactivate',
    translation: '停止する',
    partOfSpeech: 'verb',
  },
  {
    original: 'deactivate',
    translation: '無効化',
    partOfSpeech: 'verb',
  },
  {
    original: 'default',
    translation: 'デフォルト',
    partOfSpeech: 'noun',
  },
  {
    original: 'default',
    translation: '初期値',
    partOfSpeech: 'noun',
  },
  {
    original: 'default',
    translation: '初期設定',
    partOfSpeech: 'noun',
  },
  {
    original: 'default theme',
    translation: 'デフォルトテーマ',
    partOfSpeech: 'noun',
  },
  {
    original: 'deprecated',
    translation: '非推奨',
    partOfSpeech: 'adjective',
  },
  {
    original: 'description',
    translation: '説明',
    partOfSpeech: 'noun',
  },
  {
    original: 'developer',
    translation: '開発者',
    partOfSpeech: 'noun',
  },
  {
    original: 'device',
    translation: '端末',
    partOfSpeech: 'noun',
  },
  {
    original: 'directories',
    translation: 'ディレクトリ',
    partOfSpeech: 'noun',
  },
  {
    original: 'directory',
    translation: 'ディレクトリ',
    partOfSpeech: 'noun',
  },
  {
    original: 'disable',
    translation: '無効化',
    partOfSpeech: 'verb',
  },
  {
    original: 'Distraction Free Writing',
    translation: '集中執筆モード',
    partOfSpeech: 'noun',
  },
  {
    original: 'divider',
    translation: '区切り',
    partOfSpeech: 'noun',
    comment: 'Gutenberg 以外で汎用的に使う場合。',
  },
  {
    original: 'divider',
    translation: '罫線',
    partOfSpeech: 'noun',
    comment: 'Gutenberg ブロックの検索キーワードとして使う場合。',
  },
  {
    original: 'domain mapping',
    translation: 'ドメインマッピング',
    partOfSpeech: 'noun',
    comment: 'WordPress.com paid upgrade product name',
  },
  {
    original: 'domain registrar',
    translation: 'ドメイン登録業者',
    partOfSpeech: 'noun',
  },
  {
    original: 'draft',
    translation: '下書き',
    partOfSpeech: 'noun',
  },
  {
    original: 'drop',
    translation: 'ドロップ',
    partOfSpeech: 'verb',
    comment: 'ドラッグ & ドロップ操作の一部',
  },
  {
    original: 'Drop Cap',
    translation: 'ドロップキャップ',
    partOfSpeech: 'noun',
    comment: 'https://ejje.weblio.jp/content/drop+cap',
  },
  {
    original: 'e-mail',
    translation: 'メール',
    partOfSpeech: 'noun',
  },
  {
    original: 'e-mail',
    translation: 'メールアドレス',
    partOfSpeech: 'noun',
  },
  {
    original: 'eCommerce',
    translation: 'eコマース',
    partOfSpeech: 'noun',
  },
  {
    original: 'editor',
    translation: 'エディター',
    partOfSpeech: 'noun',
    comment:
      '編集ツール (例: ビジュアルエディター、テーマエディター、プラグインエディター)',
  },
  {
    original: 'Editor',
    translation: '編集者',
    partOfSpeech: 'noun',
    comment:
      '権限グループのひとつ。参照: https://wpdocs.osdn.jp/Roles_and_Capabilities',
  },
  {
    original: 'email',
    translation: 'メール',
    partOfSpeech: 'noun',
  },
  {
    original: 'email',
    translation: 'メールアドレス',
    partOfSpeech: 'noun',
  },
  {
    original: 'embed block',
    translation: '埋め込みブロック',
    partOfSpeech: 'noun',
  },
  {
    original: 'enable',
    translation: '有効化',
    partOfSpeech: 'verb',
  },
  {
    original: 'error',
    translation: 'エラー',
    partOfSpeech: 'noun',
  },
  {
    original: 'excerpt',
    translation: '抜粋',
    partOfSpeech: 'noun',
  },
  {
    original: 'Facebook',
    translation: 'Facebook',
    partOfSpeech: 'noun',
  },
  {
    original: 'featured image',
    translation: 'アイキャッチ画像',
    partOfSpeech: 'noun',
  },
  {
    original: 'featured post',
    translation: 'おすすめ投稿',
    partOfSpeech: 'noun',
  },
  {
    original: 'feed',
    translation: 'フィード',
    partOfSpeech: 'noun',
  },
  {
    original: 'filter',
    translation: 'フィルター',
    partOfSpeech: 'noun',
  },
  {
    original: 'filter',
    translation: '絞り込み',
    partOfSpeech: 'noun',
  },
  {
    original: 'filter',
    translation: '絞り込む',
    partOfSpeech: 'verb',
  },
  {
    original: 'filter hook',
    translation: 'フィルターフック',
    partOfSpeech: 'noun',
  },
  {
    original: 'folder',
    translation: 'フォルダー',
    partOfSpeech: 'noun',
  },
  {
    original: 'front end',
    translation: 'フロントエンド',
    partOfSpeech: 'adjective',
  },
  {
    original: 'front-end',
    translation: 'フロントエンド',
    partOfSpeech: 'noun',
  },
  {
    original: 'Full Site Editing',
    translation: 'フルサイト編集',
    partOfSpeech: 'noun',
  },
  {
    original: 'gallery',
    translation: 'ギャラリー',
    partOfSpeech: 'noun',
    comment: '例外で長音付き',
  },
  {
    original: 'Gutenberg',
    translation: 'Gutenberg',
    partOfSpeech: 'noun',
  },
  {
    original: 'Happiness Engineers',
    translation: 'サポートスタッフ',
    partOfSpeech: 'noun',
  },
  {
    original: 'hide',
    translation: '非表示',
    partOfSpeech: 'verb',
    comment: '"Hide XX" → "〜を非表示"',
  },
  {
    original: 'horizontal-line',
    translation: '水平線',
    partOfSpeech: 'noun',
  },
  {
    original: 'host',
    translation: 'ホスティングサービス',
    partOfSpeech: 'noun',
  },
  {
    original: 'host',
    translation: 'ホスト',
    partOfSpeech: 'noun',
    comment: '「ホスティングサービス」と訳すのが適切でない場合。',
  },
  {
    original: 'hosting provider',
    translation: 'ホスティングサービス',
    partOfSpeech: 'noun',
  },
  {
    original: 'indent',
    translation: 'インデント',
    partOfSpeech: 'verb',
  },
  {
    original: 'inserter',
    translation: 'インサーター',
    partOfSpeech: 'noun',
    comment: 'ブロックインサーター。',
  },
  {
    original: 'Inserter Tool',
    translation: '挿入ツール',
    partOfSpeech: 'noun',
    comment: 'Gutenberg 用語',
  },
  {
    original: 'installer',
    translation: 'インストーラ',
    partOfSpeech: 'noun',
  },
  {
    original: 'interface',
    translation: 'インターフェース',
    partOfSpeech: 'noun',
  },
  {
    original: 'interface',
    translation: '管理画面',
    partOfSpeech: 'noun',
  },
  {
    original: 'invalid',
    translation: '不正な',
    partOfSpeech: 'adjective',
  },
  {
    original: 'invalid',
    translation: '無効',
    partOfSpeech: 'adjective',
  },
  {
    original: 'invalid',
    translation: '間違った',
    partOfSpeech: 'adjective',
  },
  {
    original: 'IP address',
    translation: 'IP アドレス',
    partOfSpeech: 'noun',
  },
  {
    original: 'is required',
    translation: '必要',
    partOfSpeech: 'verb',
  },
  {
    original: 'item',
    translation: '項目',
    partOfSpeech: 'noun',
    comment: '一般的な事項の呼称',
  },
  {
    original: 'Learn More',
    translation: 'さらに詳しく',
    partOfSpeech: 'expression',
  },
  {
    original: 'log in',
    translation: 'ログイン',
    partOfSpeech: 'noun',
  },
  {
    original: 'log out',
    translation: 'ログアウト',
    partOfSpeech: 'noun',
  },
  {
    original: 'logged in',
    translation: 'ログイン中',
    partOfSpeech: 'adjective',
  },
  {
    original: 'logged out',
    translation: 'ログアウト中',
    partOfSpeech: 'adjective',
  },
  {
    original: 'login',
    translation: 'ログイン',
    partOfSpeech: 'verb',
  },
  {
    original: 'logout',
    translation: 'ログアウト',
    partOfSpeech: 'verb',
  },
  {
    original: 'match',
    translation: '一致',
    partOfSpeech: 'verb',
  },
  {
    original: 'media library',
    translation: 'メディアライブラリ',
    partOfSpeech: 'noun',
  },
  {
    original: 'Media Uploader',
    translation: 'メディアアップローダー',
    partOfSpeech: 'noun',
  },
  {
    original: 'memory',
    translation: 'メモリ',
    partOfSpeech: 'noun',
  },
  {
    original: 'meta',
    translation: 'メタ',
    partOfSpeech: 'noun',
  },
  {
    original: 'meta',
    translation: 'メタ情報',
    partOfSpeech: 'noun',
  },
  {
    original: 'multisite',
    translation: 'マルチサイト',
    partOfSpeech: 'noun',
  },
  {
    original: 'My Upgrades',
    translation: 'アップグレード状況',
    partOfSpeech: 'noun',
  },
  {
    original: 'name server',
    translation: 'ネームサーバー',
    partOfSpeech: 'noun',
  },
  {
    original: 'nameserver',
    translation: 'ネームサーバー',
    partOfSpeech: 'noun',
  },
  {
    original: 'navigation',
    translation: 'ナビゲーション',
    partOfSpeech: 'noun',
  },
  {
    original: 'network',
    translation: 'サイトネットワーク',
    partOfSpeech: 'verb',
    comment: 'https://goo.gl/pXLGEj 参照',
  },
  {
    original: 'next post',
    translation: '次の投稿',
    partOfSpeech: 'noun',
  },
  {
    original: 'nonce',
    translation: 'nonce',
    partOfSpeech: 'noun',
  },
  {
    original: 'not allowed to',
    translation: 'する権限がありません',
    partOfSpeech: 'expression',
  },
  {
    original: 'not sticky',
    translation: '通常通り表示',
    partOfSpeech: 'adjective',
    comment: '投稿を先頭固定表示にしないステータス。',
  },
  {
    original: 'numbered list',
    translation: '番号付きリスト',
    partOfSpeech: 'noun',
  },
  {
    original: 'object',
    translation: 'オブジェクト',
    partOfSpeech: 'noun',
  },
  {
    original: 'older post',
    translation: '過去の投稿',
    partOfSpeech: 'noun',
  },
  {
    original: 'option',
    translation: 'オプション',
    partOfSpeech: 'noun',
  },
  {
    original: 'option',
    translation: '設定',
    partOfSpeech: 'noun',
  },
  {
    original: 'outdent',
    translation: 'インデントを戻す',
    partOfSpeech: 'verb',
    comment: '※「アウトデント」ではなく。',
  },
  {
    original: 'override',
    translation: '上書き',
    partOfSpeech: 'verb',
    comment: '※「オーバーライドする」ではなく。',
  },
  {
    original: 'page',
    translation: 'ページ',
    partOfSpeech: 'noun',
  },
  {
    original: 'page',
    translation: '固定ページ',
    partOfSpeech: 'noun',
  },
  {
    original: 'pagination',
    translation: 'ページ送り',
    partOfSpeech: 'noun',
  },
  {
    original: 'parameter',
    translation: 'パラメータ',
    partOfSpeech: 'noun',
  },
  {
    original: 'permalink',
    translation: 'パーマリンク',
    partOfSpeech: 'noun',
  },
  {
    original: 'permission',
    translation: 'パーミッション',
    partOfSpeech: 'noun',
  },
  {
    original: 'permission',
    translation: '権限',
    partOfSpeech: 'noun',
  },
  {
    original: 'ping',
    translation: 'ping',
    partOfSpeech: 'noun',
  },
  {
    original: 'ping',
    translation: 'ピンバック',
    partOfSpeech: 'noun',
  },
  {
    original: 'pingback',
    translation: 'ピンバック',
    partOfSpeech: 'noun',
  },
  {
    original: 'placeholder',
    translation: 'プレースホルダー',
    partOfSpeech: 'noun',
  },
  {
    original: 'please try again',
    translation: 'もう一度お試しください',
    partOfSpeech: 'expression',
  },
  {
    original: 'plugin',
    translation: 'プラグイン',
    partOfSpeech: 'noun',
  },
  {
    original: 'poetry',
    translation: '詩',
    partOfSpeech: 'noun',
    comment: 'ただし、"Code is Poetry" というフレーズの場合は訳さない',
  },
  {
    original: 'poll',
    translation: '投票',
    partOfSpeech: 'noun',
  },
  {
    original: 'Polldaddy',
    translation: 'Polldaddy',
    partOfSpeech: 'noun',
  },
  {
    original: 'post',
    translation: '投稿',
    partOfSpeech: 'noun',
  },
  {
    original: 'post',
    translation: '投稿する',
    partOfSpeech: 'verb',
  },
  {
    original: 'post format',
    translation: '投稿フォーマット',
    partOfSpeech: 'noun',
  },
  {
    original: 'post status',
    translation: '投稿ステータス',
    partOfSpeech: 'noun',
  },
  {
    original: 'post thumbnail',
    translation: '投稿サムネイル',
    partOfSpeech: 'noun',
  },
  {
    original: 'post type',
    translation: '投稿タイプ',
    partOfSpeech: 'noun',
  },
  {
    original: 'Posted in',
    translation: 'カテゴリー:',
    partOfSpeech: 'expression',
    comment: 'テーマ内でカテゴリーリストが後に続いて使われた場合。',
  },
  {
    original: 'Posted on',
    translation: '投稿日:',
    partOfSpeech: 'expression',
    comment: 'テーマ内で日付が後に続いて使われた場合。',
  },
  {
    original: 'Poster Image',
    translation: 'ポスター画像',
    partOfSpeech: 'noun',
    comment: 'Gutenberg 用語',
  },
  {
    original: 'preformatted',
    translation: '整形済み',
    partOfSpeech: 'adjective',
  },
  {
    original: 'Press This',
    translation: 'Press This',
    partOfSpeech: 'noun',
  },
  {
    original: 'previous post',
    translation: '過去の投稿',
    partOfSpeech: 'noun',
  },
  {
    original: 'profile',
    translation: 'プロフィール',
    partOfSpeech: 'noun',
    comment: 'ユーザーの情報を表示するプロフィール画面などを指す場合。',
  },
  {
    original: 'publish',
    translation: '公開する',
    partOfSpeech: 'verb',
  },
  {
    original: 'query',
    translation: 'クエリー',
    partOfSpeech: 'noun',
  },
  {
    original: 'Quick Post',
    translation: 'クイックポスト',
    partOfSpeech: 'noun',
  },
  {
    original: 'reader',
    translation: '読者',
    partOfSpeech: 'noun',
  },
  {
    original: 'referrer',
    translation: 'リファラー',
    partOfSpeech: 'noun',
    comment: 'リンク元、参照元',
  },
  {
    original: 'registrar',
    translation: '登録業者',
    partOfSpeech: 'noun',
  },
  {
    original: 'repository',
    translation: 'リポジトリ',
    partOfSpeech: 'noun',
  },
  {
    original: 'required',
    translation: '必要',
    partOfSpeech: 'adjective',
  },
  {
    original: 'required',
    translation: '必須',
    partOfSpeech: 'adjective',
  },
  {
    original: 'resolve',
    translation: '問題を解決する',
    partOfSpeech: 'noun',
    comment: '(Gutenberg の場合) ブロックに発生した問題を解決すること',
  },
  {
    original: 'responsive',
    translation: 'レスポンシブ',
    partOfSpeech: 'adjective',
  },
  {
    original: 'return value',
    translation: '戻り値',
    partOfSpeech: 'noun',
  },
  {
    original: 'Reusable Block',
    translation: '再利用ブロック',
    partOfSpeech: 'verb',
  },
  {
    original: 'Reusable Template',
    translation: '再利用テンプレート',
    partOfSpeech: 'noun',
    comment: 'Gutenberg で保存したブロック',
  },
  {
    original: 'Revision',
    translation: 'リビジョン',
    partOfSpeech: 'noun',
    comment:
      '投稿、固定ページなどの履歴管理機能。参照: https://ja.wordpress.org/support/article/revisions/',
  },
  {
    original: 'role',
    translation: '権限グループ',
    partOfSpeech: 'noun',
  },
  {
    original: 'RSS',
    translation: 'RSS',
    partOfSpeech: 'noun',
  },
  {
    original: 'screen',
    translation: '画面',
    partOfSpeech: 'noun',
    comment: '※Screen Options は例外的に表示と訳出しています。',
  },
  {
    original: 'Screen Options',
    translation: '表示オプション',
    partOfSpeech: 'noun',
  },
  {
    original: 'self-hosted',
    translation: 'インストール型の',
    partOfSpeech: 'adjective',
  },
  {
    original: 'separator',
    translation: '区切り',
    partOfSpeech: 'noun',
    comment: 'Gutenberg で保存したテンプレート (ブロックの組み合わせ)',
  },
  {
    original: 'server',
    translation: 'サーバー',
    partOfSpeech: 'noun',
  },
  {
    original: 'sidebar',
    translation: 'サイドバー',
    partOfSpeech: 'noun',
  },
  {
    original: 'single',
    translation: '個別',
    partOfSpeech: 'noun',
    comment: '個別投稿、個別商品など',
  },
  {
    original: 'single post',
    translation: '個別投稿',
    partOfSpeech: 'noun',
  },
  {
    original: 'site',
    translation: 'サイト',
    partOfSpeech: 'noun',
  },
  {
    original: 'slug',
    translation: 'スラッグ',
    partOfSpeech: 'noun',
  },
  {
    original: 'Sorry,',
    translation: '',
    partOfSpeech: 'expression',
    comment: '※この部分は翻訳しません。',
  },
  {
    original: 'spam',
    translation: 'スパム',
    partOfSpeech: 'noun',
  },
  {
    original: 'spam filtering',
    translation: 'スパムフィルター機能',
    partOfSpeech: 'noun',
  },
  {
    original: 'Spotlight mode',
    translation: 'スポットライトモード',
    partOfSpeech: 'noun',
    comment: 'Gutenberg でのエディター表示モードの一つ',
  },
  {
    original: 'status',
    translation: 'ステータス',
    partOfSpeech: 'noun',
  },
  {
    original: 'status',
    translation: '状態',
    partOfSpeech: 'noun',
  },
  {
    original: 'stick',
    translation: '先頭に固定表示する',
    partOfSpeech: 'verb',
  },
  {
    original: 'sticky',
    translation: '先頭固定表示',
    partOfSpeech: 'adjective',
  },
  {
    original: 'strikethrough',
    translation: '打ち消し線',
    partOfSpeech: 'noun',
  },
  {
    original: 'string',
    translation: '文字列',
    partOfSpeech: 'noun',
  },
  {
    original: 'subpanel',
    translation: 'サブパネル',
    partOfSpeech: 'noun',
  },
  {
    original: 'Subscriber',
    translation: '購読者',
    partOfSpeech: 'noun',
    comment:
      '権限グループのひとつ。参照: https://wpdocs.osdn.jp/Roles_and_Capabilities',
  },
  {
    original: 'subtitle',
    translation: 'サブタイトル',
    partOfSpeech: 'noun',
    comment: '副次的な見出し',
  },
  {
    original: 'subtitle',
    translation: '字幕',
    partOfSpeech: 'noun',
    comment: '動画などの字幕',
  },
  {
    original: 'Subversion',
    translation: 'Subversion',
    partOfSpeech: 'noun',
  },
  {
    original: 'Super admin',
    translation: '特権管理者',
    partOfSpeech: 'noun',
    comment: 'マルチサイト全体の管理者。参照: http://bit.ly/2LXrzdb',
  },
  {
    original: 'survey',
    translation: 'アンケート',
    partOfSpeech: 'noun',
  },
  {
    original: 'tag',
    translation: 'タグ',
    partOfSpeech: 'noun',
  },
  {
    original: 'tagline',
    translation: 'キャッチフレーズ',
    partOfSpeech: 'noun',
  },
  {
    original: 'taxonomy',
    translation: 'タクソノミー',
    partOfSpeech: 'noun',
    comment: '例外で長音付き',
  },
  {
    original: 'template hierarchy',
    translation: 'テンプレート階層',
    partOfSpeech: 'noun',
  },
  {
    original: 'term',
    translation: 'キーワード',
    partOfSpeech: 'noun',
    comment: '検索のコンテキストの場合 (= search term)',
  },
  {
    original: 'term',
    translation: 'ターム',
    partOfSpeech: 'noun',
    comment: 'タクソノミーのコンテキストの場合。',
  },
  {
    original: 'term',
    translation: '単語',
    partOfSpeech: 'noun',
  },
  {
    original: 'term',
    translation: '語句',
    partOfSpeech: 'noun',
  },
  {
    original: 'term',
    translation: '項目',
    partOfSpeech: 'noun',
  },
  {
    original: 'text block',
    translation: 'テキストブロック',
    partOfSpeech: 'noun',
    comment: 'Gutenberg のブロックタイプ',
  },
  {
    original: 'text editor',
    translation: 'テキストエディター',
    partOfSpeech: 'noun',
  },
  {
    original: 'theme',
    translation: 'テーマ',
    partOfSpeech: 'noun',
  },
  {
    original: 'thought',
    translation: 'フィードバック',
    partOfSpeech: 'noun',
    comment:
      '"%1$s thought on “%2$s”" などの場合、コメントだけではなくピンバックを含むこともあるので「コメント」とは訳さない。Consistency Tool に同じフレーズが存在する可能性があります。',
  },
  {
    original: 'Toolbar',
    translation: 'ツールバー',
    partOfSpeech: 'noun',
  },
  {
    original: 'trackback',
    translation: 'トラックバック',
    partOfSpeech: 'noun',
  },
  {
    original: 'Transient',
    translation: 'Transient',
    partOfSpeech: 'noun',
  },
  {
    original: 'trash',
    translation: 'ゴミ箱',
    partOfSpeech: 'noun',
  },
  {
    original: 'trashed',
    translation: 'ゴミ箱内の',
    partOfSpeech: 'adjective',
  },
  {
    original: 'troubleshooting',
    translation: 'トラブルシューティング',
    partOfSpeech: 'noun',
  },
  {
    original: 'Twitter',
    translation: 'Twitter',
    partOfSpeech: 'noun',
  },
  {
    original: 'two factor authentication',
    translation: '2要素認証',
    partOfSpeech: 'noun',
  },
  {
    original: 'Two-Factor Authentication',
    translation: '2要素認証',
    partOfSpeech: 'noun',
    comment: '漢字ではなく数字の2で統一する。',
  },
  {
    original: 'Unified toolbar',
    translation: '統合ツールバー',
    partOfSpeech: 'noun',
    comment: 'Gutenberg でのツールバー表示モードの一つ',
  },
  {
    original: 'update',
    translation: '更新',
    partOfSpeech: 'noun',
  },
  {
    original: 'update',
    translation: '更新する',
    partOfSpeech: 'verb',
  },
  {
    original: 'upgrade',
    translation: 'アップグレード',
    partOfSpeech: 'noun',
  },
  {
    original: 'uploader',
    translation: 'アップローダー',
    partOfSpeech: 'noun',
  },
  {
    original: 'URI',
    translation: 'URL',
    partOfSpeech: 'noun',
  },
  {
    original: 'user',
    translation: 'ユーザー',
    partOfSpeech: 'noun',
  },
  {
    original: 'valid',
    translation: '有効',
    partOfSpeech: 'adjective',
  },
  {
    original: 'valid',
    translation: '正しい',
    partOfSpeech: 'adjective',
  },
  {
    original: 'verse',
    translation: '詩',
    partOfSpeech: 'noun',
  },
  {
    original: 'video',
    translation: '動画',
    partOfSpeech: 'noun',
  },
  {
    original: 'view',
    translation: 'ビュー',
    partOfSpeech: 'noun',
    comment:
      'ほとんどの場合は「表示」と訳すが、タブビューやリストビューなどの表示形式の慣用名などの例外ではこちらでも可。',
  },
  {
    original: 'view',
    translation: '表示',
    partOfSpeech: 'verb',
  },
  {
    original: 'web server',
    translation: 'Web サーバー',
    partOfSpeech: 'noun',
    comment:
      '文頭でなくても W は大文字に統一する。単に「サーバー」としてもいい場合もある。',
  },
  {
    original: 'website',
    translation: 'サイト',
    partOfSpeech: 'noun',
  },
  {
    original: 'WordCamp',
    translation: 'WordCamp',
    partOfSpeech: 'noun',
  },
  {
    original: 'WordPress',
    translation: 'WordPress',
    partOfSpeech: 'noun',
  },
  {
    original: 'WordPress Dashboard',
    translation: 'WordPress ダッシュボード',
    partOfSpeech: 'noun',
  },
  {
    original: 'WordPress.com',
    translation: 'WordPress.com',
    partOfSpeech: 'noun',
  },
  {
    original: 'XML-RPC',
    translation: 'XML-RPC',
    partOfSpeech: 'noun',
  },
]
