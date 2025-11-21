import {RocketIcon, UsersIcon, CommentIcon} from '@sanity/icons'
import type {StructureBuilder, StructureResolver} from 'sanity/structure'
import {JudgeNotesView} from '../components/JudgeNotesView'

/**
 * Structure builder for the hackathon dashboard
 * Organizes projects, hackers, and judge notes in a clean sidebar
 */

const DISABLED_TYPES = ['assist.instruction.context']

export const structure: StructureResolver = (S: StructureBuilder) =>
  S.list()
    .title('Hackathon Dashboard')
    .items([
      // Projects - with inline judge notes
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
                .child(
                  S.documentTypeList('project')
                    .title('All Projects')
                    .child((documentId) =>
                      S.document()
                        .documentId(documentId)
                        .schemaType('project')
                        .views([
                          S.view.form(),
                          // Add a view showing judge notes for this project
                          S.view
                            .component(({documentId}: {documentId: string}) => (
                              <JudgeNotesView documentId={documentId} />
                            ))
                            .icon(CommentIcon)
                            .id('judgeNotes')
                            .title('Judge Notes'),
                        ]),
                    ),
                ),
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

      // Judge Notes
      S.listItem()
        .title('Judge Notes')
        .icon(CommentIcon)
        .child(S.documentTypeList('judgeNote').title('Judge Notes')),

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

