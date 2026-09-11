import { Eyebrow } from '@/components/Eyebrow'
import { Headline } from '@/components/Headline'
import { Page } from '@/components/Page'
import { PublicHeader } from '@/components/PublicHeader'
import { signIn as copy } from '@/copy/start'
import { SignInForm } from './SignInForm'

export default function SignIn() {
  return (
    <Page header={<PublicHeader signIn={false} />}>
      <div className="flex flex-col gap-6">
        <Eyebrow>{copy.eyebrow}</Eyebrow>
        <Headline text={copy.headline} />
        <SignInForm />
      </div>
    </Page>
  )
}
