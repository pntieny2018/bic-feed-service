import { CONTENT_TARGET } from '@beincom/constants';
import { emoji } from 'node-emoji';
import { v4, validate as isUUID } from 'uuid';

import { DomainAggregateRoot } from '../../../../../common/domain-model/domain-aggregate-root';
import { REACTION_TARGET } from '../../../data-type';

export const BIC_EMOJI = [
  'bic_check_mark',
  'bic_clapping_hands',
  'bic_clinking_beer_mugs',
  'bic_clinking_glasses',
  'bic_crown',
  'bic_fire',
  'bic_flag',
  'bic_glowing_star',
  'bic_handshake',
  'bic_heart',
  'bic_heart_exclamation',
  'bic_heart_gift',
  'bic_hugging_face',
  'bic_hundred_points',
  'bic_light_bulb',
  'bic_money_mouth_face',
  'bic_money_with_wings',
  'bic_muscle_diamond',
  'bic_partying_face',
  'bic_raising_hands',
  'bic_revolving_hearts',
  'bic_screaming',
  'bic_smiling_face_with_heart_eyes',
  'bic_sparkling_heart',
  'bic_star_struck',
  'bic_text',
  'bic_text_x10k',
  'bic_thumbs_up',
  'bic_tothemoon',
  'bic_trophy',
  'bic_unicorn',
  'bic_violet',
  'bic_violet_moon',
  'bic_warning',
  'bic_writing_hand',
  'bic_x10k',
  'bic_airplane',
  'bic_diamond',
  'bic_direct_hit',
  'bic_fireworks',
  'bic_flying_rocket',
  'bic_globe',
  'bic_growing_heart',
  'bic_party_popper',
  'bic_purple_heart',
  'bic_smiling_face_with_hearts',
  'bic_sparkles',
  'bic_whale',
];

export type ReactionAttributes = {
  id: string;
  target: REACTION_TARGET | CONTENT_TARGET;
  targetId: string;
  reactionName: string;
  createdBy: string;
  createdAt?: Date;
};
export class ReactionEntity extends DomainAggregateRoot<ReactionAttributes> {
  public constructor(props: ReactionAttributes) {
    super(props);
  }

  public static create(options: Partial<ReactionAttributes>): ReactionEntity {
    return new ReactionEntity({
      id: v4(),
      createdAt: new Date(),
      target: options.target,
      targetId: options.targetId,
      reactionName: options.reactionName,
      createdBy: options.createdBy,
    });
  }

  public validate(): void {
    if (!isUUID(this._props.id)) {
      throw new Error('Reaction ID is not UUID');
    }
    if (this._props.targetId && !isUUID(this._props.targetId)) {
      throw new Error('Target ID is not UUID');
    }
    if (!isUUID(this._props.createdBy)) {
      throw new Error('Created By is not UUID');
    }
    if (![...BIC_EMOJI, ...Object.keys(emoji)].includes(this._props.reactionName)) {
      throw new Error('Reaction name is not a valid emoji');
    }
  }
}
