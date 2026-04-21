CREATE TABLE public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  player_school_id uuid REFERENCES public.player_schools(id) ON DELETE SET NULL,
  school_id uuid NOT NULL REFERENCES public.schools(id),

  -- Tuition actually offered (may differ from school's published rate)
  tuition_per_year numeric,

  -- Aid breakdown (annual dollar amounts)
  athletic_scholarship numeric NOT NULL DEFAULT 0,
  merit_aid numeric NOT NULL DEFAULT 0,
  need_based_aid numeric NOT NULL DEFAULT 0,
  other_aid numeric NOT NULL DEFAULT 0,

  -- Offer metadata
  offer_date date,
  decision_deadline date,
  status text NOT NULL DEFAULT 'evaluating'
    CHECK (status IN ('evaluating', 'accepted', 'declined')),
  notes text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can manage own offers"
  ON public.offers
  FOR ALL
  USING (
    player_id IN (
      SELECT id FROM public.players WHERE user_id = auth.uid()
    )
  );
