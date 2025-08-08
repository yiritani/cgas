import Head from 'next/head'
import { useState } from 'react'
import {
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  Button,
  IconButton,
  Card,
  Link as SakuraLink,
  Table,
  Thead,
  Tbody,
  Th,
  Tr,
  Td,
} from '@sakura-ui/core'
import {
  Input,
  Select,
  Textarea,
  Checkbox,
  Radio,
  LabelControl,
  FieldsetControl,
} from '@sakura-ui/forms'
import Layout from '../components/Layout'

export default function SakuraTest() {
  const [count, setCount] = useState(0)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: '',
    message: '',
    newsletter: false,
    priority: 'medium',
  })

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <>
      <Head>
        <title>Sakura UI テスト</title>
        <meta
          name="description"
          content="Sakura UI コンポーネントのテストページ"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Layout>
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
          {/* ヘッダーセクション */}
          <section style={{ marginBottom: '3rem' }}>
            <H1>🌸 Sakura UI テストページ</H1>
            <p>デジタル庁デザインシステムベースのUIコンポーネントライブラリ</p>
          </section>

          {/* 見出しセクション */}
          <section style={{ marginBottom: '3rem' }}>
            <H2>見出しコンポーネント</H2>
            <div style={{ marginLeft: '1rem' }}>
              <H1>見出し1 (H1)</H1>
              <H2>見出し2 (H2)</H2>
              <H3>見出し3 (H3)</H3>
              <H4>見出し4 (H4)</H4>
              <H5>見出し5 (H5)</H5>
              <H6>見出し6 (H6)</H6>
            </div>
          </section>

          {/* ボタンセクション */}
          <section style={{ marginBottom: '3rem' }}>
            <H2>ボタンコンポーネント</H2>
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                flexWrap: 'wrap',
                marginTop: '1rem',
              }}
            >
              <Button
                onClick={() => setCount(count + 1)}
                className="inline-flex items-center justify-center rounded-xl"
              >
                カウント: {count}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setCount(0)}
                className="inline-flex items-center justify-center rounded-xl"
              >
                リセット
              </Button>
              <IconButton icon="favorite">お気に入り</IconButton>
              <IconButton icon="settings" variant="secondary">
                設定
              </IconButton>
            </div>
          </section>

          {/* カードセクション */}
          <section style={{ marginBottom: '3rem' }}>
            <H2>カードコンポーネント</H2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1rem',
                marginTop: '1rem',
              }}
            >
              <Card>
                <H3>カード1</H3>
                <p>
                  これはSakura
                  UIのカードコンポーネントです。デジタル庁のデザインシステムに基づいています。
                </p>
                <Button
                  style={{ marginTop: '1rem' }}
                  className="inline-flex items-center justify-center rounded-xl"
                >
                  詳細を見る
                </Button>
              </Card>
              <Card>
                <H3>カード2</H3>
                <p>
                  Tailwind
                  CSSとReactを使用して実装されており、アクセシビリティにも配慮されています。
                </p>
                <Button
                  variant="secondary"
                  style={{ marginTop: '1rem' }}
                  className="inline-flex items-center justify-center rounded-xl"
                >
                  もっと見る
                </Button>
              </Card>
            </div>
          </section>

          {/* フォームセクション */}
          <section style={{ marginBottom: '3rem' }}>
            <H2>フォームコンポーネント</H2>
            <Card style={{ marginTop: '1rem' }}>
              <form onSubmit={(e) => e.preventDefault()}>
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                  <LabelControl label="お名前" required>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange('name', e.target.value)
                      }
                      placeholder="山田太郎"
                    />
                  </LabelControl>

                  <LabelControl label="メールアドレス" required>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange('email', e.target.value)
                      }
                      placeholder="yamada@example.com"
                    />
                  </LabelControl>

                  <LabelControl label="カテゴリ">
                    <Select
                      value={formData.category}
                      onChange={(e) =>
                        handleInputChange('category', e.target.value)
                      }
                    >
                      <option value="">選択してください</option>
                      <option value="inquiry">お問い合わせ</option>
                      <option value="feedback">フィードバック</option>
                      <option value="support">サポート</option>
                    </Select>
                  </LabelControl>

                  <FieldsetControl legend="優先度">
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <Radio
                        name="priority"
                        value="high"
                        checked={formData.priority === 'high'}
                        onChange={(e) =>
                          handleInputChange('priority', e.target.value)
                        }
                      >
                        高
                      </Radio>
                      <Radio
                        name="priority"
                        value="medium"
                        checked={formData.priority === 'medium'}
                        onChange={(e) =>
                          handleInputChange('priority', e.target.value)
                        }
                      >
                        中
                      </Radio>
                      <Radio
                        name="priority"
                        value="low"
                        checked={formData.priority === 'low'}
                        onChange={(e) =>
                          handleInputChange('priority', e.target.value)
                        }
                      >
                        低
                      </Radio>
                    </div>
                  </FieldsetControl>

                  <LabelControl label="メッセージ">
                    <Textarea
                      value={formData.message}
                      onChange={(e) =>
                        handleInputChange('message', e.target.value)
                      }
                      placeholder="ご用件をお聞かせください"
                      rows={4}
                    />
                  </LabelControl>

                  <Checkbox
                    checked={formData.newsletter}
                    onChange={(e) =>
                      handleInputChange('newsletter', e.target.checked)
                    }
                  >
                    ニュースレターを受け取る
                  </Checkbox>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button
                      type="submit"
                      className="inline-flex items-center justify-center rounded-xl"
                    >
                      送信
                    </Button>
                    <Button
                      variant="secondary"
                      type="button"
                      className="inline-flex items-center justify-center rounded-xl"
                    >
                      キャンセル
                    </Button>
                  </div>
                </div>
              </form>
            </Card>
          </section>

          {/* テーブルセクション */}
          <section style={{ marginBottom: '3rem' }}>
            <H2>テーブルコンポーネント</H2>
            <Table style={{ marginTop: '1rem' }}>
              <Thead>
                <Tr>
                  <Th>ID</Th>
                  <Th>名前</Th>
                  <Th>メール</Th>
                  <Th>ステータス</Th>
                  <Th>操作</Th>
                </Tr>
              </Thead>
              <Tbody>
                <Tr>
                  <Td>1</Td>
                  <Td>山田太郎</Td>
                  <Td>yamada@example.com</Td>
                  <Td>アクティブ</Td>
                  <Td>
                    <Button
                      size="small"
                      className="inline-flex items-center justify-center rounded-xl"
                    >
                      編集
                    </Button>
                  </Td>
                </Tr>
                <Tr>
                  <Td>2</Td>
                  <Td>佐藤花子</Td>
                  <Td>sato@example.com</Td>
                  <Td>非アクティブ</Td>
                  <Td>
                    <Button
                      size="small"
                      variant="secondary"
                      className="inline-flex items-center justify-center rounded-xl"
                    >
                      編集
                    </Button>
                  </Td>
                </Tr>
              </Tbody>
            </Table>
          </section>

          {/* リンクセクション */}
          <section>
            <H2>その他のコンポーネント</H2>
            <div style={{ marginTop: '1rem' }}>
              <p>
                <SakuraLink href="/">ホームページに戻る</SakuraLink> |{' '}
                <SakuraLink
                  href="https://github.com/glassonion1/sakura-ui"
                  external
                >
                  Sakura UI GitHub
                </SakuraLink>
              </p>
            </div>
          </section>
        </div>
      </Layout>
    </>
  )
}
