import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { Env } from '../../config/env.schema';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;
  private readonly from: string;

  constructor(private readonly config: ConfigService<Env, true>) {
    const host = this.config.get('SMTP_HOST', { infer: true });
    const port = this.config.get('SMTP_PORT', { infer: true }) ?? 587;
    const user = this.config.get('SMTP_USER', { infer: true });
    const pass = this.config.get('SMTP_PASS', { infer: true });
    this.from =
      this.config.get('SMTP_FROM', { infer: true }) ??
      user ??
      'Vibra <noreply@vibra.app>';

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log(`SMTP configured (${host}:${port})`);
    } else {
      this.logger.warn('SMTP not configured; verification emails will be logged only');
    }
  }

  async sendModelVerified(to: string, displayName: string) {
    const subject = 'Tu perfil en Vibra fue verificado';
    const text = [
      `Hola ${displayName},`,
      '',
      '¡Buenas noticias! Tu perfil de modelo en Vibra fue verificado y ya está aprobado.',
      'Ya puedes iniciar sesión, aparecer en Explorar y recibir chats.',
      '',
      'Gracias por formar parte de Vibra.',
      '— Equipo Vibra',
    ].join('\n');

    const html = `
      <div style="font-family:sans-serif;line-height:1.5;color:#111">
        <p>Hola <strong>${escapeHtml(displayName)}</strong>,</p>
        <p>¡Buenas noticias! Tu perfil de modelo en <strong>Vibra</strong> fue <strong>verificado</strong> y ya está aprobado.</p>
        <p>Ya puedes iniciar sesión, aparecer en Explorar y recibir chats.</p>
        <p>Gracias por formar parte de Vibra.<br/>— Equipo Vibra</p>
      </div>
    `;

    return this.send({ to, subject, text, html });
  }

  async sendModelRejected(to: string, displayName: string) {
    const subject = 'Actualización de tu solicitud en Vibra';
    const text = [
      `Hola ${displayName},`,
      '',
      'Revisamos tu solicitud de modelo en Vibra y por ahora no fue aprobada.',
      'Si crees que es un error, responde a este correo o contacta soporte con tu cuenta registrada.',
      '',
      '— Equipo Vibra',
    ].join('\n');

    return this.send({ to, subject, text });
  }

  private async send(opts: {
    to: string;
    subject: string;
    text: string;
    html?: string;
  }) {
    if (!this.transporter) {
      this.logger.log(`[mail:dry-run] to=${opts.to} subject=${opts.subject}\n${opts.text}`);
      return { ok: true, dryRun: true };
    }

    await this.transporter.sendMail({
      from: this.from,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    });
    return { ok: true, dryRun: false };
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
