import { LockClosedIcon } from '@heroicons/react/24/outline'
import { Button, Card, FieldError, Form, Input, Label, TextField } from '@heroui/react'
import { FirebaseError } from 'firebase/app'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { useState, type FormEvent } from 'react'
import { auth } from '../../lib/firebase'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setPending(true)
    setError(null)
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password)
    } catch (err) {
      const code = err instanceof FirebaseError ? err.code : ''
      setError(
        code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found'
          ? 'Wrong email or password.'
          : code === 'auth/too-many-requests'
            ? 'Too many attempts. Try again later.'
            : 'Could not sign in. Check your connection.',
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <Card className="mx-auto w-full max-w-sm">
      <Card.Header>
        <LockClosedIcon className="size-8 text-accent" />
        <Card.Title>Admin sign in</Card.Title>
        <Card.Description>Only allowlisted administrators can change the lot settings.</Card.Description>
      </Card.Header>
      <Card.Content>
        <Form onSubmit={submit} className="flex flex-col gap-4">
          <TextField name="email" type="email" value={email} onChange={setEmail} isRequired autoComplete="username">
            <Label>Email</Label>
            <Input />
          </TextField>
          <TextField
            name="password"
            type="password"
            value={password}
            onChange={setPassword}
            isRequired
            autoComplete="current-password"
            isInvalid={Boolean(error)}
          >
            <Label>Password</Label>
            <Input />
            <FieldError>{error}</FieldError>
          </TextField>
          <Button type="submit" variant="primary" isPending={pending} fullWidth>
            Sign in
          </Button>
        </Form>
      </Card.Content>
    </Card>
  )
}
