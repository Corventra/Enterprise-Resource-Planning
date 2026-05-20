const {
  leadHasMinutes,
  leadHasProposal,
  leadHasEngagementLetter,
  leadHasHandover
} = require('./lead-workspace-readiness');

describe('lead-workspace-readiness', () => {
  describe('leadHasMinutes', () => {
    it('returns true when minutes row exists for lead', async () => {
      const conn = {
        execute: jest.fn().mockResolvedValue([[{ minute_id: 1 }]])
      };
      await expect(leadHasMinutes(conn, 10)).resolves.toBe(true);
      expect(conn.execute).toHaveBeenCalledWith(expect.stringContaining('FROM minutes'), [10]);
    });

    it('returns false when no minutes row exists', async () => {
      const conn = {
        execute: jest.fn().mockResolvedValue([[]])
      };
      await expect(leadHasMinutes(conn, 10)).resolves.toBe(false);
    });
  });

  describe('leadHasProposal', () => {
    it('returns true when proposal row exists for lead', async () => {
      const conn = {
        execute: jest.fn().mockResolvedValue([[{ proposal_id: 5 }]])
      };
      await expect(leadHasProposal(conn, 10)).resolves.toBe(true);
      expect(conn.execute).toHaveBeenCalledWith(expect.stringContaining('FROM proposals'), [10]);
    });

    it('returns false when no proposal row exists', async () => {
      const conn = {
        execute: jest.fn().mockResolvedValue([[]])
      };
      await expect(leadHasProposal(conn, 10)).resolves.toBe(false);
    });
  });

  describe('leadHasEngagementLetter', () => {
    it('returns true when engagement letter row exists for lead', async () => {
      const conn = {
        execute: jest.fn().mockResolvedValue([[{ engagement_id: 3 }]])
      };
      await expect(leadHasEngagementLetter(conn, 10)).resolves.toBe(true);
      expect(conn.execute).toHaveBeenCalledWith(expect.stringContaining('FROM engagement_letters'), [10]);
    });

    it('returns false when no engagement letter row exists', async () => {
      const conn = {
        execute: jest.fn().mockResolvedValue([[]])
      };
      await expect(leadHasEngagementLetter(conn, 10)).resolves.toBe(false);
    });
  });

  describe('leadHasHandover', () => {
    it('returns true when handover row exists for lead', async () => {
      const conn = {
        execute: jest.fn().mockResolvedValue([[{ handover_id: 7 }]])
      };
      await expect(leadHasHandover(conn, 10)).resolves.toBe(true);
      expect(conn.execute).toHaveBeenCalledWith(expect.stringContaining('FROM handovers'), [10]);
    });

    it('returns false when no handover row exists', async () => {
      const conn = {
        execute: jest.fn().mockResolvedValue([[]])
      };
      await expect(leadHasHandover(conn, 10)).resolves.toBe(false);
    });
  });
});
