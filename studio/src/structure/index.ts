import {RocketIcon, UsersIcon} from '@sanity/icons'
import type {StructureBuilder, StructureResolver} from 'sanity/structure'

/**
 * Structure builder for the hackathon dashboard
 * Organizes projects and hackers in a clean sidebar
 */

const DISABLED_TYPES = ['assist.instruction.context']

export const structure: StructureResolver = (S: StructureBuilder) =>
  S.list()
    .title('Hackathon Dashboard')
    .items([
      // Projects - organized by status
      S.listItem()
        .title('Projects')
        .icon(RocketIcon)
        .child(
          S.list()
            .title('Projects')
            .items([
              S.listItem()
                .title('All Projects')
                .icon(RocketIcon)
                .child(S.documentTypeList('project').title('All Projects')),
              S.divider(),
              S.listItem()
                .title('⏳ Analyzing')
                .child(
                  S.documentList()
                    .title('Analyzing')
                    .filter('_type == "project" && status == "analyzing"'),
                ),
              S.listItem()
                .title('✅ Analyzed')
                .child(
                  S.documentList()
                    .title('Analyzed')
                    .filter('_type == "project" && status == "analyzed"'),
                ),
              S.listItem()
                .title('🏆 Winners')
                .child(
                  S.documentList()
                    .title('Winners')
                    .filter('_type == "project" && status == "winner"'),
                ),
              S.listItem()
                .title('❌ Failed')
                .child(
                  S.documentList()
                    .title('Failed')
                    .filter('_type == "project" && status == "failed"'),
                ),
            ]),
        ),

      S.divider(),

      // Hackers
      S.listItem()
        .title('Hackers')
        .icon(UsersIcon)
        .child(S.documentTypeList('hacker').title('Hackers')),

      S.divider(),

      // Filter out disabled types
      ...S.documentTypeListItems().filter(
        (listItem: any) => !DISABLED_TYPES.includes(listItem.getId()),
      ),
    ])
