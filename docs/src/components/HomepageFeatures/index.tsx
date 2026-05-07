import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'สำหรับนักศึกษา (Intern)',
    Svg: require('@site/static/img/undraw_time-change_lyxp.svg').default,
    description: (
      <>
        บันทึกเวลาเข้า-ออกงานผ่านระบบ พร้อมติดตามชั่วโมงการฝึกงานสะสม และส่งคำขอลาหรือแก้ไขเวลาได้ในที่เดียว
      </>
    ),
  },
  {
    title: 'สำหรับพี่เลี้ยง (Mentor)',
    Svg: require('@site/static/img/undraw_all-checked_d3u6.svg').default,
    description: (
      <>
        ตรวจสอบและอนุมัติคำขอต่างๆ ของนักศึกษาในดูแลได้อย่างสะดวกรวดเร็ว พร้อมติดตามสถานะการเข้างานและงานนอกสถานที่ได้แบบ Real-time
      </>
    ),
  },
  {
    title: 'สำหรับผู้ดูแลระบบ (Admin)',
    Svg: require('@site/static/img/undraw_web-app_141a.svg').default,
    description: (
      <>
        Dashboard สรุปสถิติภาพรวมและข้อมูลรายบุคคลอย่างละเอียด ติดตามสถิติการเข้างาน อัตราการลา และส่งออกรายงานผลการฝึกงานได้อย่างครบถ้วน
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
