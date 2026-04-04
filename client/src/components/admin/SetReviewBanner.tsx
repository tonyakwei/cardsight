import { Group, Text, Button } from "@mantine/core";

interface Props {
  modifiedCount: number;
  onReview: () => void;
}

export function SetReviewBanner({ modifiedCount, onReview }: Props) {
  if (modifiedCount === 0) return null;

  return (
    <Group
      justify="space-between"
      p="sm"
      px="md"
      mb="md"
      style={{
        borderRadius: "8px",
        background: "rgba(212, 168, 67, 0.08)",
        border: "1px solid rgba(212, 168, 67, 0.25)",
      }}
    >
      <Text size="sm" c="yellow.5">
        {modifiedCount} card{modifiedCount !== 1 ? "s" : ""} modified since last
        review
      </Text>
      <Button size="xs" variant="light" color="yellow" onClick={onReview}>
        Mark as Reviewed
      </Button>
    </Group>
  );
}
