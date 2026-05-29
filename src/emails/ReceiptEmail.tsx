// React Email template — server-side only.
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

type LineItem = {
  course_id: number;
  course_title: string;
  price: number; // satang
};

export type ReceiptEmailProps = {
  customerName: string;
  orderId: string;
  totalAmount: number; // satang
  paidAt: string; // ISO
  items: LineItem[];
  siteUrl: string;
};

const formatBaht = (satang: number) =>
  `฿${(satang / 100).toLocaleString("th-TH")}`;

export function ReceiptEmail({
  customerName,
  orderId,
  totalAmount,
  paidAt,
  items,
  siteUrl,
}: ReceiptEmailProps) {
  const friendlyDate = new Date(paidAt).toLocaleString("th-TH", {
    dateStyle: "long",
    timeStyle: "short",
  });
  return (
    <Html lang="th">
      <Head />
      <Preview>ใบเสร็จคำสั่งซื้อจาก Warit Academy</Preview>
      <Tailwind>
        <Body className="bg-slate-50 font-sans py-10">
          <Container className="bg-white rounded-2xl mx-auto max-w-xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <Section className="bg-gradient-to-br from-blue-700 to-blue-900 px-8 py-10 text-center">
              <Img
                src="https://api.dicebear.com/9.x/icons/png?icon=graduation-cap&backgroundColor=ffffff&backgroundType=solid&radius=50&size=64"
                alt="Warit Academy"
                width="56"
                height="56"
                className="mx-auto mb-4 rounded-2xl"
              />
              <Heading className="text-white text-2xl font-bold m-0 mb-2">
                ชำระเงินสำเร็จ 🎉
              </Heading>
              <Text className="text-blue-100 m-0 text-sm">
                ขอบคุณที่ร่วมเรียนกับ Warit Academy
              </Text>
            </Section>

            {/* Greeting */}
            <Section className="px-8 pt-8 pb-2">
              <Text className="text-slate-700 text-base m-0">
                สวัสดี{customerName ? ` คุณ${customerName}` : ""},
              </Text>
              <Text className="text-slate-600 text-sm mt-3 leading-6">
                เราได้รับการชำระเงินของคุณเรียบร้อยแล้ว
                คุณสามารถเริ่มเรียนคอร์สที่ซื้อได้ทันทีจากปุ่มด้านล่าง
              </Text>
            </Section>

            {/* Order info */}
            <Section className="px-8 py-4">
              <table className="w-full text-sm" cellPadding="0" cellSpacing="0">
                <tr>
                  <td className="text-slate-500 py-1">เลขคำสั่งซื้อ</td>
                  <td className="text-right text-slate-700 py-1 font-mono">
                    {orderId.slice(0, 8)}
                  </td>
                </tr>
                <tr>
                  <td className="text-slate-500 py-1">วันที่ชำระ</td>
                  <td className="text-right text-slate-700 py-1">
                    {friendlyDate}
                  </td>
                </tr>
                <tr>
                  <td className="text-slate-500 py-1">วิธีการชำระเงิน</td>
                  <td className="text-right text-slate-700 py-1">PromptPay</td>
                </tr>
              </table>
            </Section>

            <Hr className="border-slate-100 mx-8" />

            {/* Items */}
            <Section className="px-8 py-4">
              <Heading
                as="h2"
                className="text-slate-900 text-base font-semibold m-0 mb-4"
              >
                คอร์สที่ซื้อ ({items.length})
              </Heading>
              {items.map((item) => (
                <div
                  key={item.course_id}
                  className="border border-slate-200 rounded-xl p-4 mb-3"
                >
                  <table cellPadding="0" cellSpacing="0" className="w-full">
                    <tr>
                      <td className="align-top">
                        <Text className="text-slate-900 font-medium m-0 text-sm leading-5">
                          {item.course_title}
                        </Text>
                        <Link
                          href={`${siteUrl}/learn/${item.course_id}`}
                          className="text-blue-700 text-xs no-underline font-medium"
                        >
                          เริ่มเรียนทันที →
                        </Link>
                      </td>
                      <td className="align-top text-right whitespace-nowrap pl-3">
                        <Text className="text-slate-700 text-sm m-0">
                          {formatBaht(item.price)}
                        </Text>
                      </td>
                    </tr>
                  </table>
                </div>
              ))}
            </Section>

            <Hr className="border-slate-100 mx-8" />

            {/* Total */}
            <Section className="px-8 py-4">
              <table className="w-full" cellPadding="0" cellSpacing="0">
                <tr>
                  <td>
                    <Text className="text-slate-700 font-semibold m-0">
                      ยอดชำระทั้งหมด
                    </Text>
                  </td>
                  <td className="text-right">
                    <Text className="text-blue-700 text-2xl font-bold m-0">
                      {formatBaht(totalAmount)}
                    </Text>
                  </td>
                </tr>
              </table>
            </Section>

            {/* CTA */}
            <Section className="px-8 py-6 text-center">
              <Link
                href={`${siteUrl}/my-courses`}
                className="bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold no-underline text-sm inline-block"
              >
                ไปหน้าคอร์สของฉัน
              </Link>
            </Section>

            <Hr className="border-slate-100 mx-8" />

            {/* Footer */}
            <Section className="px-8 py-6">
              <Text className="text-slate-500 text-xs leading-5 m-0 text-center">
                Warit Academy — แพลตฟอร์มเรียนออนไลน์คุณภาพสูง
                <br />
                เก็บอีเมลนี้ไว้เป็นหลักฐานการชำระเงิน
              </Text>
              <Text className="text-slate-400 text-xs mt-3 text-center m-0">
                หากมีข้อสงสัยเกี่ยวกับคำสั่งซื้อ ตอบกลับอีเมลนี้ได้เลย
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default ReceiptEmail;
