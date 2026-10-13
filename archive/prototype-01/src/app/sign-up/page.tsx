import { Eyebrow } from '@/components/Eyebrow'
import { Headline } from '@/components/Headline'
import { Page } from '@/components/Page'
import { PublicHeader } from '@/components/PublicHeader'
import { signUp as copy } from '@/copy/start'
import { SignUpForm } from './SignUpForm'

export default function SignUp() {
  return (
    <Page header={<PublicHeader />}>
      <div className="flex flex-col gap-6">
        <Eyebrow>{copy.eyebrow}</Eyebrow>
        <Headline text={copy.headline} />
        <p className="text-body-lg text-ink-muted">{copy.body}</p>
        <SignUpForm />
      </div>
    </Page>
  )
}
