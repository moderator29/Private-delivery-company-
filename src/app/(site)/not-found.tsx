import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Surface";
import { SearchIcon } from "@/components/ui/icons";

export default function NotFound() {
  return (
    <Container className="py-20 text-center sm:py-28">
      <span className="inline-flex size-14 items-center justify-center rounded-full bg-ink-100 text-ink-500">
        <SearchIcon className="size-7" />
      </span>
      <p className="mt-5 text-sm font-bold tracking-[0.14em] text-brand-600 uppercase">404</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
        We could not find that page
      </h1>
      <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-ink-600">
        The link may be out of date, or the address may have a typo in it. If you were looking for a
        shipment, the tracking page is the place to start.
      </p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <ButtonLink href="/track" size="lg">
          Track a shipment
        </ButtonLink>
        <ButtonLink href="/" size="lg" variant="secondary">
          Back to home
        </ButtonLink>
      </div>
    </Container>
  );
}
